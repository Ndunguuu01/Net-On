// ============================================
// Net-On API — Subscription Controller
// ============================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './services/subscription.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  RenewSubscriptionDto,
  QuerySubscriptionDto,
} from './dto/subscription.dto';
import { Roles } from '../auth/decorators/roles.decorator';

import { SubscriptionCronService } from './services/subscription-cron.service';

@ApiTags('Subscriptions')
@ApiBearerAuth('JWT-auth')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly cronService: SubscriptionCronService,
  ) {}

  @Post('trigger-cron')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Manually trigger subscription lifecycle & renewal invoicing maintenance' })
  async triggerCron() {
    const result = await this.cronService.runMaintenance();
    return { message: 'Subscription maintenance completed', data: result };
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Create a new subscription for a customer' })
  async create(@Body() dto: CreateSubscriptionDto) {
    const subscription = await this.subscriptionService.create(dto);
    return { message: 'Subscription created successfully', data: subscription };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SUPPORT')
  @ApiOperation({ summary: 'List subscriptions with pagination and filters' })
  async findAll(@Query() query: QuerySubscriptionDto) {
    return this.subscriptionService.findAll(query);
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get subscription statistics' })
  async getStats() {
    const stats = await this.subscriptionService.getStats();
    return { data: stats };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SUPPORT')
  @ApiOperation({ summary: 'Get subscription details by ID' })
  async findOne(@Param('id') id: string) {
    const subscription = await this.subscriptionService.findOne(id);
    return { data: subscription };
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update subscription details' })
  async update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    const subscription = await this.subscriptionService.update(id, dto);
    return { message: 'Subscription updated successfully', data: subscription };
  }

  @Post(':id/renew')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Renew a subscription' })
  async renew(@Param('id') id: string, @Body() dto: RenewSubscriptionDto) {
    const subscription = await this.subscriptionService.renew(id, dto);
    return { message: 'Subscription renewed successfully', data: subscription };
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Suspend a subscription' })
  async suspend(@Param('id') id: string) {
    const subscription = await this.subscriptionService.suspend(id);
    return { message: 'Subscription suspended', data: subscription };
  }

  @Post(':id/expire')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Force-expire a subscription' })
  async expire(@Param('id') id: string) {
    const subscription = await this.subscriptionService.expire(id);
    return { message: 'Subscription expired', data: subscription };
  }
}
