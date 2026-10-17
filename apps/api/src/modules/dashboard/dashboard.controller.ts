// ============================================
// Net-On API — Dashboard Controller
// ============================================

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'TECHNICIAN', 'SUPPORT')
  @ApiOperation({ summary: 'Get aggregated system stats for dashboard' })
  async getStats() {
    return this.dashboardService.getStats();
  }
}
