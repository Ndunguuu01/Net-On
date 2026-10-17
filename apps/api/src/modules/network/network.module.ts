// ============================================
// Net-On API — Network Module
// ============================================

import { Module } from '@nestjs/common';
import { NetworkController } from './network.controller';
import { NetworkAccountService } from './services/network-account.service';
import { AuthModule } from '../auth/auth.module';
import { RouterModule } from '../router/router.module';

@Module({
  imports: [AuthModule, RouterModule],
  controllers: [NetworkController],
  providers: [NetworkAccountService],
  exports: [NetworkAccountService],
})
export class NetworkModule {}
