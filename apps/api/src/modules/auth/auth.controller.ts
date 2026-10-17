// ============================================
// Net-On API — Auth Controller
// ============================================

import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './services/auth.service';
import { LoginDto, RefreshTokenDto, ChangePasswordDto, LogoutDto } from './dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Request password reset token.
   */
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset token/link' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * Reset password using token.
   */
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  /**
   * Login with email and password.
   * Returns access token + refresh token.
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.authService.login(dto.email, dto.password, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
    });

    return {
      message: 'Login successful',
      ...result,
    };
  }

  /**
   * Refresh an access token using a valid refresh token.
   * Implements token rotation — old token is revoked.
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const tokens = await this.authService.refresh(dto.refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
    });

    return {
      message: 'Token refreshed successfully',
      tokens,
    };
  }

  /**
   * Logout — revoke the refresh token.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Body() dto: LogoutDto, @CurrentUser('id') userId: string) {
    if (dto.refreshToken) {
      await this.authService.logout(dto.refreshToken);
    }
    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from ALL devices.
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@CurrentUser('id') userId: string) {
    await this.authService.logoutAll(userId);
    return { message: 'All sessions revoked' };
  }

  /**
   * Change password. Revokes all existing sessions.
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change current password' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Password changed successfully. Please log in again.' };
  }

  /**
   * Get the authenticated user's profile.
   */
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
