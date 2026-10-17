// ============================================
// Net-On API — Auth DTOs
// ============================================

import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@neton.co.ke' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'ChangeThisPassword123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'The refresh token to rotate' })
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @MaxLength(128, { message: 'New password must not exceed 128 characters' })
  newPassword: string;
}

export class LogoutDto {
  @ApiPropertyOptional({ description: 'Refresh token to revoke' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
