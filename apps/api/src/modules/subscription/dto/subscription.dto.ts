// ============================================
// Net-On API — Subscription DTOs
// ============================================

import {
  IsUUID,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsDateString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Internet package ID' })
  @IsUUID()
  packageId: string;

  @ApiPropertyOptional({ description: 'Start date (defaults to today)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Auto-renew on expiry', default: true })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'Change package' })
  @IsOptional()
  @IsUUID()
  packageId?: string;

  @ApiPropertyOptional({ description: 'Toggle auto-renew' })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

export class RenewSubscriptionDto {
  @ApiPropertyOptional({ description: 'Override package for renewal' })
  @IsOptional()
  @IsUUID()
  packageId?: string;
}

export class QuerySubscriptionDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Search by customer name/number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: string;
}
