// ============================================
// Net-On API — Token Service
// ============================================
// JWT access & refresh token management with
// token family rotation for replay detection.
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../database/prisma.service';
import * as crypto from 'crypto';

export interface JwtPayload {
  sub: string;       // user ID
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate an access + refresh token pair for a user.
   */
  async generateTokenPair(
    userId: string,
    email: string,
    role: string,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<TokenPair> {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'refresh',
    };

    const accessExpiry = this.config.get<string>('JWT_ACCESS_EXPIRATION', '15m');
    const refreshExpiry = this.config.get<string>('JWT_REFRESH_EXPIRATION', '7d');
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

    const accessToken = this.jwt.sign(accessPayload, {
      secret: accessSecret,
      expiresIn: accessExpiry,
    });

    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiry,
    });

    // Store refresh token hash in database
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = this.calculateExpiry(refreshExpiry);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        userAgent: metadata?.userAgent?.substring(0, 500),
        ipAddress: metadata?.ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiryToSeconds(accessExpiry),
    };
  }

  /**
   * Validate a refresh token and rotate it (issue new pair).
   * Implements token family rotation for replay detection.
   */
  async rotateRefreshToken(
    refreshToken: string,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<TokenPair | null> {
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      return null;
    }

    if (payload.type !== 'refresh') {
      return null;
    }

    const tokenHash = this.hashToken(refreshToken);

    // Find the stored token
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      // Token not found — potential replay attack.
      // Revoke ALL tokens for this user's family.
      this.logger.warn(
        `Refresh token replay detected for user ${payload.sub}`,
      );
      await this.revokeAllUserTokens(payload.sub);
      return null;
    }

    if (storedToken.isRevoked) {
      // Revoked token reuse — revoke entire family
      this.logger.warn(
        `Revoked refresh token reuse for user ${payload.sub}, family ${storedToken.family}`,
      );
      await this.revokeTokenFamily(storedToken.family);
      return null;
    }

    if (storedToken.expiresAt < new Date()) {
      return null;
    }

    // Revoke the old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Issue new pair
    return this.generateTokenPair(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
      metadata,
    );
  }

  /**
   * Revoke a specific refresh token.
   */
  async revokeToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }

  /**
   * Revoke all refresh tokens for a user.
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /**
   * Revoke all tokens in a token family (replay protection).
   */
  private async revokeTokenFamily(family: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { family },
      data: { isRevoked: true },
    });
  }

  /**
   * Clean up expired refresh tokens from the database.
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });
    return result.count;
  }

  /**
   * SHA-256 hash for storing refresh tokens safely.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private calculateExpiry(expiry: string): Date {
    const seconds = this.parseExpiryToSeconds(expiry);
    return new Date(Date.now() + seconds * 1000);
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 900; // fallback 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }
}
