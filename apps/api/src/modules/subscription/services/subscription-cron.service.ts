// ============================================
// Net-On API — Subscription Cron Service
// ============================================
// Automated daily background job for subscription
// lifecycle maintenance: grace period transitions,
// auto-expiry, and renewal invoice generation.
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';
import { InvoiceService } from '../../invoice/services/invoice.service';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly invoiceService: InvoiceService,
  ) {}

  /**
   * Daily midnight automated maintenance job.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyMaintenance() {
    this.logger.log('Starting automated daily subscription maintenance cron...');
    return this.runMaintenance();
  }

  /**
   * Execute full subscription maintenance cycle.
   */
  async runMaintenance() {
    // 1. Process expiry and status transitions
    const expiryResults = await this.subscriptionService.processExpiryChecks();

    // 2. Generate renewal invoices for expiring subscriptions
    const invoiceResults = await this.invoiceService.generateBulk();

    this.logger.log(
      `Daily maintenance complete: ${expiryResults.movedToGrace} to grace, ${expiryResults.movedToExpired} expired, ${expiryResults.movedToSuspended} suspended | ${invoiceResults.generated} invoices generated.`,
    );

    return {
      timestamp: new Date().toISOString(),
      lifecycle: expiryResults,
      invoicing: invoiceResults,
    };
  }
}
