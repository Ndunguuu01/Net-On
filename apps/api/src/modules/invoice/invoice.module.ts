// ============================================
// Net-On API — Invoice Module
// ============================================

import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { InvoiceNumberService } from './services/invoice-number.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoiceNumberService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
