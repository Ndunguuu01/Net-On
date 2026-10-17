// ============================================
// Net-On API — Subscription Module
// ============================================

import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './services/subscription.service';
import { SubscriptionCronService } from './services/subscription-cron.service';
import { AuthModule } from '../auth/auth.module';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
  imports: [AuthModule, InvoiceModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionCronService],
  exports: [SubscriptionService, SubscriptionCronService],
})
export class SubscriptionModule {}
