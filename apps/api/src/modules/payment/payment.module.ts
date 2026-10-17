// ============================================
// Net-On API — Payment Module
// ============================================

import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './services/payment.service';
import { MpesaService } from './services/mpesa.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PaymentController],
  providers: [PaymentService, MpesaService],
  exports: [PaymentService, MpesaService],
})
export class PaymentModule {}
