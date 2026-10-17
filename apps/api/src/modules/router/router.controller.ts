// ============================================
// Net-On API — Router Controller
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
import { RouterService } from './services/router.service';
import { CreateRouterDto, UpdateRouterDto, QueryRouterDto } from './dto/router.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Routers')
@ApiBearerAuth('JWT-auth')
@Controller('routers')
export class RouterController {
  constructor(private readonly routerService: RouterService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Add a new MikroTik router' })
  async create(@Body() dto: CreateRouterDto) {
    const router = await this.routerService.create(dto);
    return { message: 'Router added successfully', data: router };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN')
  @ApiOperation({ summary: 'List all routers' })
  async findAll(@Query() query: QueryRouterDto) {
    const routers = await this.routerService.findAll(query);
    return { data: routers };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get router details' })
  async findOne(@Param('id') id: string) {
    const router = await this.routerService.findOne(id);
    return { data: router };
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update router configuration' })
  async update(@Param('id') id: string, @Body() dto: UpdateRouterDto) {
    const router = await this.routerService.update(id, dto);
    return { message: 'Router updated successfully', data: router };
  }

  @Post(':id/health-check')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN')
  @ApiOperation({ summary: 'Run health check on router' })
  async healthCheck(@Param('id') id: string) {
    const health = await this.routerService.checkHealth(id);
    return { data: health };
  }

  @Get(':id/sessions')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get active sessions from router' })
  async getSessions(@Param('id') id: string) {
    const sessions = await this.routerService.getActiveSessions(id);
    return { data: sessions };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Remove a router' })
  async remove(@Param('id') id: string) {
    return this.routerService.remove(id);
  }
}
