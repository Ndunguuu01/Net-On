// ============================================
// Net-On API — Notification Service
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly smsProvider: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.smsProvider = config.get<string>('SMS_PROVIDER', 'mock');
    this.logger.log(`Notification service initialized — SMS: ${this.smsProvider.toUpperCase()}`);
  }

  async sendSms(customerId: string, message: string, subject?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, phone: true, firstName: true },
    });
    if (!customer) return;

    const notification = await this.prisma.notification.create({
      data: {
        customerId,
        channel: 'SMS',
        type: 'GENERAL',
        subject: subject || 'Net-On Notification',
        message,
        status: this.smsProvider === 'mock' ? 'SENT' : 'PENDING',
        sentAt: this.smsProvider === 'mock' ? new Date() : null,
      },
    });

    if (this.smsProvider === 'mock') {
      this.logger.debug(`[MOCK SMS] → ${customer.phone}: ${message}`);
    }

    return notification;
  }

  async findAll(query: { page?: number; limit?: number; channel?: string; status?: string }) {
    const { page = 1, limit = 20, channel, status } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (channel) where.channel = channel;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, customerNumber: true, firstName: true, lastName: true, phone: true } },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
