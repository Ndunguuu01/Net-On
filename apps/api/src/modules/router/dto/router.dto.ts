// ============================================
// Net-On API — Router DTOs
// ============================================

import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRouterDto {
  @ApiProperty({ description: 'Router display name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Management IP address' })
  @IsString()
  managementIp: string;

  @ApiPropertyOptional({ description: 'API port', default: 8728 })
  @IsOptional()
  @IsInt()
  apiPort?: number;

  @ApiProperty({ description: 'RouterOS API username' })
  @IsString()
  apiUsername: string;

  @ApiProperty({ description: 'RouterOS API password' })
  @IsString()
  apiPassword: string;

  @ApiPropertyOptional({ description: 'Physical location' })
  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateRouterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managementIp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  apiPort?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiUsername?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiPassword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;
}

export class QueryRouterDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
