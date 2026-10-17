// ============================================
// Net-On API — Package & Network Profile DTOs
// ============================================

import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum BillingCycleEnum {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

export enum PackageStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class CreatePackageDto {
  @ApiProperty({ example: 'Home Fiber 20M' })
  @IsString()
  @MinLength(2, { message: 'Package name must be at least 2 characters' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'High-speed 20Mbps unlimited home internet package' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 3000, description: 'Monthly price in KES' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a valid number' })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ enum: BillingCycleEnum, default: BillingCycleEnum.MONTHLY })
  @IsOptional()
  @IsEnum(BillingCycleEnum)
  billingCycle?: BillingCycleEnum = BillingCycleEnum.MONTHLY;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays?: number = 30;

  @ApiProperty({ example: 20, description: 'Download speed numeric value' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  downloadSpeed: number;

  @ApiProperty({ example: 20, description: 'Upload speed numeric value' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  uploadSpeed: number;

  @ApiPropertyOptional({ example: 'Mbps', default: 'Mbps' })
  @IsOptional()
  @IsString()
  speedUnit?: string = 'Mbps';

  @ApiPropertyOptional({ example: 3, default: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  gracePeriodDays?: number = 3;

  @ApiPropertyOptional({ example: '40M/40M 20M/20M 8/8', description: 'MikroTik custom burst rate limit config' })
  @IsOptional()
  @IsString()
  burstConfig?: string;

  @ApiPropertyOptional({ example: 'dhcp_pool_1' })
  @IsOptional()
  @IsString()
  addressPool?: string;
}

export class UpdatePackageDto {
  @ApiPropertyOptional({ example: 'Home Fiber 20M' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: BillingCycleEnum })
  @IsOptional()
  @IsEnum(BillingCycleEnum)
  billingCycle?: BillingCycleEnum;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  downloadSpeed?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  uploadSpeed?: number;

  @ApiPropertyOptional({ example: 'Mbps' })
  @IsOptional()
  @IsString()
  speedUnit?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  gracePeriodDays?: number;

  @ApiPropertyOptional({ enum: PackageStatusEnum })
  @IsOptional()
  @IsEnum(PackageStatusEnum)
  status?: PackageStatusEnum;
}

export class QueryPackageDto {
  @ApiPropertyOptional({ description: 'Search package name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PackageStatusEnum })
  @IsOptional()
  @IsEnum(PackageStatusEnum)
  status?: PackageStatusEnum;
}
