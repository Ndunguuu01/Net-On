// ============================================
// Net-On API — Staff Controller
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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Staff')
@ApiBearerAuth('JWT-auth')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create a new staff member with linked user account' })
  async create(@Body() dto: any) {
    const member = await this.staffService.create(dto);
    return { message: 'Staff member created successfully', data: member };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List staff members with filters' })
  async findAll(@Query() query: any) {
    return this.staffService.findAll(query);
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get staff statistics by role and department' })
  async getStats() {
    const stats = await this.staffService.getStats();
    return { data: stats };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get staff member details' })
  async findOne(@Param('id') id: string) {
    const member = await this.staffService.findOne(id);
    return { data: member };
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update staff member details or role' })
  async update(@Param('id') id: string, @Body() dto: any) {
    const member = await this.staffService.update(id, dto);
    return { message: 'Staff member updated', data: member };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Deactivate a staff member' })
  async deactivate(@Param('id') id: string) {
    return this.staffService.deactivate(id);
  }
}
