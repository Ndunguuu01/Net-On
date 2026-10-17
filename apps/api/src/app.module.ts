// ============================================
// Net-On API — Root Application Module
// ============================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { PackageModule } from './modules/package/package.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { PaymentModule } from './modules/payment/payment.module';
import { RouterModule } from './modules/router/router.module';
import { NetworkModule } from './modules/network/network.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SupportModule } from './modules/support/support.module';
import { AuditModule } from './modules/audit/audit.module';
import { SettingsModule } from './modules/settings/settings.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PortalModule } from './modules/portal/portal.module';
import { ReportModule } from './modules/report/report.module';
import { StaffModule } from './modules/staff/staff.module';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';

@Module({
  controllers: [AppController],
  imports: [
    CommonModule,
    // --- Environment Configuration ---
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // --- Rate Limiting ---
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,   // 1 second
        limit: 10,    // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000,   // 1 minute
        limit: 100,   // 100 requests per minute
      },
    ]),

    // --- Task Scheduling & Automation ---
    ScheduleModule.forRoot(),

    // --- Database ---
    PrismaModule,

    // --- Core Modules ---
    HealthModule,
    AuthModule,

    // --- Domain Modules ---
    CustomerModule,
    PackageModule,
    SubscriptionModule,
    InvoiceModule,
    PaymentModule,
    RouterModule,
    NetworkModule,
    NotificationModule,
    SupportModule,
    AuditModule,
    SettingsModule,
    DashboardModule,
    PortalModule,
    ReportModule,
    StaffModule,
  ],
})
export class AppModule {}


