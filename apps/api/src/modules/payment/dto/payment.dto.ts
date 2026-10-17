// ============================================
// Net-On API — Payment DTOs
// ============================================

import {
  IsUUID,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsPhoneNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StkPushDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Amount in KES' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Phone number (254...)' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Invoice ID to reconcile' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Description shown in STK prompt' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ManualPaymentDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Amount in KES' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Payment provider (CASH, BANK_TRANSFER, MPESA_MANUAL)' })
  @IsString()
  provider: string;

  @ApiProperty({ description: 'Transaction reference' })
  @IsString()
  transactionReference: string;

  @ApiPropertyOptional({ description: 'Invoice ID to reconcile' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Phone number (for M-Pesa)' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class MpesaCallbackDto {
  @ApiProperty()
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>;
      };
    };
  };
}

export class QueryPaymentDto {
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

  @ApiPropertyOptional({ description: 'Filter by provider' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Search by ref or phone' })
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
