// ============================================
// Net-On API — Auth Service Unit Tests
// ============================================

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let passwordService: any;
  let tokenService: any;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'admin@neton.co.ke',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$mockHashValue',
    role: 'SUPER_ADMIN',
    isActive: true,
    failedLogins: 0,
    lockedUntil: null,
  };

  const mockTokens = {
    accessToken: 'mock-access-jwt',
    refreshToken: 'mock-refresh-jwt',
    expiresIn: 900,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    passwordService = {
      verify: jest.fn(),
      hash: jest.fn().mockResolvedValue('new-hashed-password'),
      needsRehash: jest.fn().mockReturnValue(false),
    };

    tokenService = {
      generateTokenPair: jest.fn().mockResolvedValue(mockTokens),
      rotateRefreshToken: jest.fn(),
      revokeToken: jest.fn(),
      revokeAllUserTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: PasswordService, useValue: passwordService },
        { provide: TokenService, useValue: tokenService },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-signed-jwt'),
            verify: jest.fn().mockReturnValue({ sub: 'user-uuid-1', type: 'password_reset' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-jwt-secret-key-64-bytes-long!'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should successfully authenticate with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      passwordService.verify.mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });

      const result = await service.login('admin@neton.co.ke', 'CorrectPassword123!');

      expect(result).toBeDefined();
      expect(result.tokens).toEqual(mockTokens);
      expect(result.user.email).toEqual(mockUser.email);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({ failedLogins: 0, lockedUntil: null }),
        }),
      );
    });

    it('should reject non-existent user with UnauthorizedException', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('nonexistent@neton.co.ke', 'Password123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject deactivated user with ForbiddenException', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        service.login('admin@neton.co.ke', 'CorrectPassword123!'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject locked account with ForbiddenException', async () => {
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, lockedUntil });

      await expect(
        service.login('admin@neton.co.ke', 'CorrectPassword123!'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should increment failedLogins counter on invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      passwordService.verify.mockResolvedValue(false);
      prisma.user.update.mockResolvedValue(mockUser);

      await expect(
        service.login('admin@neton.co.ke', 'WrongPassword123!'),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: { failedLogins: 1 },
        }),
      );
    });
  });

  describe('forgotPassword & resetPassword', () => {
    it('should generate reset token for active user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.forgotPassword('admin@neton.co.ke');
      expect(result).toBeDefined();
      expect(result.resetToken).toBe('mock-signed-jwt');
    });

    it('should reset password and invalidate sessions with valid reset token', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.resetPassword('mock-signed-jwt', 'NewSecurePassword123!');
      expect(result.message).toContain('successfully');
      expect(tokenService.revokeAllUserTokens).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
