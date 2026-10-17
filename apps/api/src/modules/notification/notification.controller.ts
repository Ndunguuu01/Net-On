// ============================================
// Net-On API — Notification Controller
// ============================================

import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './services/notification.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send-sms')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Send an SMS notification to a customer' })
  async sendSms(@Body() dto: { customerId: string; message: string; subject?: string }) {
    const notification = await this.notificationService.sendSms(dto.customerId, dto.message, dto.subject);
    return { message: 'SMS sent', data: notification };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'List notification history' })
  async findAll(@Query() query: any) {
    return this.notificationService.findAll(query);
  }
}
