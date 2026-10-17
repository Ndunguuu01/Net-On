// ============================================
// Net-On API — Health Check Controller
// ============================================

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';
import { Public } from '../modules/auth/decorators/public.decorator';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Overall system health — checks all dependencies.
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Overall system health check' })
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }

  /**
   * Liveness probe — is the server running?
   */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — is the server process running?' })
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'net-on-api',
    };
  }

  /**
   * Readiness probe — is the server ready to accept requests?
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — is the server ready for traffic?' })
  ready() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }
}
