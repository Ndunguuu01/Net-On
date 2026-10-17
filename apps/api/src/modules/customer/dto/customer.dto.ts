// ============================================
// Net-On API — Customer DTOs
// ============================================

import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum CustomerStatusEnum {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
  ARCHIVED = 'ARCHIVED',
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Kamau' })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: '254712345678', description: 'Kenyan phone number in 2547XXXXXXXX or 07XXXXXXXX format' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'john.kamau@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address format' })
  email?: string;

  @ApiPropertyOptional({ example: 'House 42, Westlands' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Plot 10, Waiyaki Way, Nairobi' })
  @IsOptional()
  @IsString()
  installationAddress?: string;

  @ApiPropertyOptional({ example: 'Nairobi / Westlands' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'VIP Customer — Priority installation' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Kamau' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: '254712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'john.kamau@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'House 42, Westlands' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Plot 10, Waiyaki Way, Nairobi' })
  @IsOptional()
  @IsString()
  installationAddress?: string;

  @ApiPropertyOptional({ example: 'Nairobi / Westlands' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'VIP Customer' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryCustomerDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term for name, phone, email, or customer number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CustomerStatusEnum })
  @IsOptional()
  @IsEnum(CustomerStatusEnum)
  status?: CustomerStatusEnum;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class SuspendCustomerDto {
  @ApiPropertyOptional({ example: 'Non-payment of outstanding monthly invoice' })
  @IsOptional()
  @IsString()
  reason?: string;
}
