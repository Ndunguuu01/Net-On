// ============================================
// Net-On API — Router Module
// ============================================

import { Module } from '@nestjs/common';
import { RouterController } from './router.controller';
import { RouterService } from './services/router.service';
import { MikrotikService } from './services/mikrotik.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RouterController],
  providers: [RouterService, MikrotikService],
  exports: [RouterService, MikrotikService],
})
export class RouterModule {}
