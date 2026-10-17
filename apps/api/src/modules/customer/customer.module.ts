// ============================================
// Net-On API — Customer Module
// ============================================

import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './services/customer.service';
import { CustomerNumberService } from './services/customer-number.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CustomerController],
  providers: [CustomerService, CustomerNumberService],
  exports: [CustomerService, CustomerNumberService],
})
export class CustomerModule {}
