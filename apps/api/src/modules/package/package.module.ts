// ============================================
// Net-On API — Package Module
// ============================================

import { Module } from '@nestjs/common';
import { PackageController } from './package.controller';
import { PackageService } from './services/package.service';
import { NetworkProfileService } from './services/network-profile.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PackageController],
  providers: [PackageService, NetworkProfileService],
  exports: [PackageService, NetworkProfileService],
})
export class PackageModule {}
