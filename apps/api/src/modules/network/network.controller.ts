// ============================================
// Net-On API — Network Controller
// ============================================

import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NetworkAccountService } from './services/network-account.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RouterService } from '../router/services/router.service';

@ApiTags('Network')
@ApiBearerAuth('JWT-auth')
@Controller('network')
export class NetworkController {
  constructor(
    private readonly networkAccountService: NetworkAccountService,
    private readonly routerService: RouterService,
  ) {}

  @Post('accounts')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN')
  @ApiOperation({ summary: 'Create a network account' })
  async createAccount(@Body() dto: any) {
    const account = await this.networkAccountService.create(dto);
    return { message: 'Network account created', data: account };
  }

  @Get('sessions/live')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get active live network sessions' })
  async getLiveSessions() {
    const sessions = await this.networkAccountService.getLiveSessions();
    return { data: sessions };
  }

  @Get('accounts')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN')
  @ApiOperation({ summary: 'List network accounts' })
  async findAllAccounts(@Query() query: any) {
    return this.networkAccountService.findAll(query);
  }

  @Get('accounts/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get network account details' })
  async findOneAccount(@Param('id') id: string) {
    const account = await this.networkAccountService.findOne(id);
    return { data: account };
  }

  @Get('routers/:id/health')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN')
  @ApiOperation({ summary: 'Check router health via MikroTik API' })
  async checkRouterHealth(@Param('id') id: string) {
    const health = await this.routerService.checkHealth(id);
    return { data: health };
  }

  @Delete('accounts/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Disable a network account' })
  async removeAccount(@Param('id') id: string) {
    return this.networkAccountService.remove(id);
  }
}

