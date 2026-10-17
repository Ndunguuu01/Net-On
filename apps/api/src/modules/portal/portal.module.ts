// ============================================
// Net-On API — Portal Module
// ============================================

import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}
