// ============================================
// Net-On API — Invoice DTOs
// ============================================

import {
  IsUUID,
  IsOptional,
  IsString,
  IsInt,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'Subscription ID (auto-links billing period)' })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiProperty({ description: 'Invoice items' })
  items: CreateInvoiceItemDto[];

  @ApiPropertyOptional({ description: 'Discount amount', default: 0 })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({ description: 'Due date (defaults to 7 days from now)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class CreateInvoiceItemDto {
  @ApiProperty({ description: 'Line item description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({ description: 'Unit price in KES' })
  @IsNumber()
  unitPrice: number;
}

export class QueryInvoiceDto {
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

  @ApiPropertyOptional({ description: 'Search' })
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

export class MarkInvoicePaidDto {
  @ApiProperty({ description: 'Amount paid' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Payment reference' })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}
