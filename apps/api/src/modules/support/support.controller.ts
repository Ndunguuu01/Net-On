import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './services/support.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Support')
@ApiBearerAuth('JWT-auth')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Create a support ticket' })
  async create(@Body() dto: any) {
    const ticket = await this.supportService.create(dto);
    return { message: 'Ticket created', data: ticket };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'List support tickets' })
  async findAll(@Query() query: any) {
    return this.supportService.findAll(query);
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get ticket statistics' })
  async getStats() {
    const stats = await this.supportService.getStats();
    return { data: stats };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get ticket details' })
  async findOne(@Param('id') id: string) {
    const ticket = await this.supportService.findOne(id);
    return { data: ticket };
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Resolve a ticket' })
  async resolve(@Param('id') id: string) {
    const ticket = await this.supportService.resolve(id);
    return { message: 'Ticket resolved', data: ticket };
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Close a ticket' })
  async close(@Param('id') id: string) {
    const ticket = await this.supportService.close(id);
    return { message: 'Ticket closed', data: ticket };
  }
}
