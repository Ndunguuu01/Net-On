// ============================================
// Net-On API — Network Profile Service
// ============================================
// Manages MikroTik bandwidth profiles & rate limits.
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class NetworkProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Format download & upload speed into a standard RouterOS rate-limit string.
   * Format: `tx/rx` (e.g. `20M/20M` or `512k/512k`)
   */
  formatRateLimit(uploadSpeed: number, downloadSpeed: number, unit: string = 'Mbps'): string {
    const suffix = unit.toUpperCase() === 'MBPS' || unit.toUpperCase() === 'M' ? 'M' : 'k';
    return `${uploadSpeed}${suffix}/${downloadSpeed}${suffix}`;
  }

  /**
   * Find or create a matching network profile for an internet package.
   */
  async findOrCreateProfile(
    packageName: string,
    uploadSpeed: number,
    downloadSpeed: number,
    speedUnit: string = 'Mbps',
    burstConfig?: string,
    addressPool?: string,
  ) {
    const rateLimitString = this.formatRateLimit(uploadSpeed, downloadSpeed, speedUnit);
    const profileName = `NET-PROFILE-${packageName.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;

    const existing = await this.prisma.networkProfile.findFirst({
      where: {
        OR: [{ name: profileName }, { rateLimitString }],
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.networkProfile.create({
      data: {
        name: profileName,
        description: `Rate limit profile for ${packageName}`,
        downloadSpeed,
        uploadSpeed,
        speedUnit,
        rateLimitString,
        burstConfig,
        addressPool,
      },
    });
  }

  /**
   * List all network profiles.
   */
  async findAll() {
    return this.prisma.networkProfile.findMany({
      orderBy: { downloadSpeed: 'asc' },
      include: {
        _count: {
          select: {
            packages: true,
            networkAccounts: true,
          },
        },
      },
    });
  }
}
