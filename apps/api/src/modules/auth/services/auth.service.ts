// ============================================
// Net-On API — Auth Service
// ============================================
// Core authentication logic: login, register,
// token refresh, logout, and account lockout.
// ============================================

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { PasswordService } from './password.service';
import { TokenService, TokenPair } from './token.service';
import { ACCOUNT_LOCKOUT_ATTEMPTS, ACCOUNT_LOCKOUT_DURATION } from '@neton/shared';

export interface LoginResult {
  tokens: TokenPair;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Authenticate a user with email and password.
   */
  async login(
    email: string,
    password: string,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account has been deactivated. Please contact support.');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Account is locked. Try again in ${minutesLeft} minute(s).`,
      );
    }

    // Verify password
    const isValid = await this.passwordService.verify(user.passwordHash, password);

    if (!isValid) {
      // Increment failed login counter
      const failedLogins = user.failedLogins + 1;
      const updateData: Record<string, unknown> = { failedLogins };

      if (failedLogins >= ACCOUNT_LOCKOUT_ATTEMPTS) {
        updateData.lockedUntil = new Date(
          Date.now() + ACCOUNT_LOCKOUT_DURATION * 1000,
        );
        this.logger.warn(
          `Account locked for ${user.email} after ${failedLogins} failed attempts`,
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset failed login counter on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Check if password needs rehashing
    if (this.passwordService.needsRehash(user.passwordHash)) {
      const newHash = await this.passwordService.hash(password);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    }

    // Generate token pair
    const tokens = await this.tokenService.generateTokenPair(
      user.id,
      user.email,
      user.role,
      metadata,
    );

    this.logger.log(`User ${user.email} logged in successfully`);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Refresh an access token using a valid refresh token.
   */
  async refresh(
    refreshToken: string,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<TokenPair> {
    const tokens = await this.tokenService.rotateRefreshToken(
      refreshToken,
      metadata,
    );

    if (!tokens) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return tokens;
  }

  /**
   * Logout — revoke the refresh token.
   */
  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeToken(refreshToken);
  }

  /**
   * Logout from all devices — revoke all refresh tokens.
   */
  async logoutAll(userId: string): Promise<void> {
    await this.tokenService.revokeAllUserTokens(userId);
    this.logger.log(`All sessions revoked for user ${userId}`);
  }

  /**
   * Change a user's password.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await this.passwordService.verify(
      user.passwordHash,
      currentPassword,
    );

    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await this.passwordService.hash(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all tokens to force re-login
    await this.tokenService.revokeAllUserTokens(userId);
    this.logger.log(`Password changed for user ${userId}`);
  }

  /**
   * Request password reset token.
   */
  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      // Do not reveal whether user exists
      return {
        message: 'If the email exists, a password reset link has been dispatched.',
      };
    }

    const secret = this.config.get<string>('JWT_ACCESS_SECRET');
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'password_reset' },
      { secret, expiresIn: '1h' },
    );

    this.logger.log(`Password reset token generated for user ${user.email}`);

    return {
      message: 'Password reset link has been generated.',
      resetToken,
    };
  }

  /**
   * Complete password reset using token.
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const secret = this.config.get<string>('JWT_ACCESS_SECRET');
    let payload: any;

    try {
      payload = this.jwtService.verify(token, { secret });
    } catch {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (payload.type !== 'password_reset' || !payload.sub) {
      throw new BadRequestException('Invalid reset token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('User account not found or inactive');
    }

    const newHash = await this.passwordService.hash(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        failedLogins: 0,
        lockedUntil: null,
      },
    });

    // Invalidate all active sessions
    await this.tokenService.revokeAllUserTokens(user.id);
    this.logger.log(`Password successfully reset for user ${user.email}`);

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  /**
   * Get the current user's profile.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            customerNumber: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
