// ============================================
// Net-On API — Password Reset DTOs
// ============================================

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'admin@neton.co.ke',
    description: 'Email address of the user requesting password recovery',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token received via recovery link or SMS',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'New password (minimum 8 characters)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'New password is required' })
  newPassword: string;
}
