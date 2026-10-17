// ============================================
// Net-On API — Report Controller
// ============================================

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('revenue')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Revenue breakdown by month, package, and payment provider' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months to include (default: 12)' })
  async getRevenueReport(@Query('months') months?: string) {
    const data = await this.reportService.getRevenueReport(months ? parseInt(months, 10) : 12);
    return { data };
  }

  @Get('subscribers')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Subscriber growth, churn, and package distribution' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months to include (default: 12)' })
  async getSubscriberReport(@Query('months') months?: string) {
    const data = await this.reportService.getSubscriberReport(months ? parseInt(months, 10) : 12);
    return { data };
  }

  @Get('collections')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Collection efficiency, outstanding balances, and overdue metrics' })
  async getCollectionsReport() {
    const data = await this.reportService.getCollectionsReport();
    return { data };
  }

  @Get('network')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN')
  @ApiOperation({ summary: 'Network statistics — router load, sessions, sync status' })
  async getNetworkReport() {
    const data = await this.reportService.getNetworkReport();
    return { data };
  }
}
