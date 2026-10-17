// ============================================
// Net-On API — Package & Network Profile Controller
// ============================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PackageService } from './services/package.service';
import { NetworkProfileService } from './services/network-profile.service';
import {
  CreatePackageDto,
  UpdatePackageDto,
  QueryPackageDto,
} from './dto/package.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Packages')
@ApiBearerAuth('JWT-auth')
@Controller('packages')
export class PackageController {
  constructor(
    private readonly packageService: PackageService,
    private readonly networkProfileService: NetworkProfileService,
  ) {}

  /**
   * Create a new internet package.
   */
  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create a new internet package' })
  async create(@Body() dto: CreatePackageDto) {
    const pkg = await this.packageService.create(dto);
    return {
      message: 'Internet package created successfully',
      data: pkg,
    };
  }

  /**
   * List all internet packages.
   */
  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'TECHNICIAN', 'SUPPORT')
  @ApiOperation({ summary: 'List all active internet packages' })
  async findAll(@Query() query: QueryPackageDto) {
    const packages = await this.packageService.findAll(query);
    return { data: packages };
  }

  /**
   * List all network profiles (MikroTik rate limits).
   */
  @Get('network-profiles')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN')
  @ApiOperation({ summary: 'List all network bandwidth profiles' })
  async findAllNetworkProfiles() {
    const profiles = await this.networkProfileService.findAll();
    return { data: profiles };
  }

  /**
   * Get single package by ID.
   */
  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'TECHNICIAN', 'SUPPORT')
  @ApiOperation({ summary: 'Get package details by ID' })
  async findOne(@Param('id') id: string) {
    const pkg = await this.packageService.findOne(id);
    return { data: pkg };
  }

  /**
   * Update package details and speed limits.
   */
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update package details' })
  async update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    const pkg = await this.packageService.update(id, dto);
    return {
      message: 'Package updated successfully',
      data: pkg,
    };
  }

  /**
   * Soft-delete / archive package.
   */
  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Archive package' })
  async remove(@Param('id') id: string) {
    return this.packageService.remove(id);
  }
}
