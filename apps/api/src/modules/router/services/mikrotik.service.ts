// ============================================
// Net-On API — MikroTik RouterOS Service
// ============================================
// Handles communication with MikroTik routers.
// Supports 'mock' mode for development.
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RouterHealthStatus {
  online: boolean;
  identity: string;
  version: string;
  uptime: string;
  cpuLoad: number;
  freeMemory: number;
  totalMemory: number;
  activeSessions: number;
}

export interface HotspotUser {
  name: string;
  password: string;
  profile: string;
  server?: string;
  macAddress?: string;
  ipAddress?: string;
}

@Injectable()
export class MikrotikService {
  private readonly logger = new Logger(MikrotikService.name);
  private readonly mode: string;

  constructor(private readonly config: ConfigService) {
    this.mode = config.get<string>('MIKROTIK_MODE', 'mock');
    this.logger.log(`MikroTik service initialized in ${this.mode.toUpperCase()} mode`);
  }

  /**
   * Check router health and capabilities.
   */
  async checkHealth(host: string, port: number, username: string, password: string): Promise<RouterHealthStatus> {
    if (this.mode === 'mock') {
      return this.mockHealth(host);
    }

    // TODO: Implement live RouterOS API connection
    return this.mockHealth(host);
  }

  /**
   * Create a hotspot/PPPoE user on the router.
   */
  async createUser(routerConfig: any, user: HotspotUser): Promise<boolean> {
    if (this.mode === 'mock') {
      this.logger.debug(`[MOCK] Creating user ${user.name} on router ${routerConfig.managementIp}`);
      return true;
    }

    // TODO: Implement live RouterOS API user creation
    return true;
  }

  /**
   * Update user profile/rate limit on the router.
   */
  async updateUser(routerConfig: any, username: string, updates: Partial<HotspotUser>): Promise<boolean> {
    if (this.mode === 'mock') {
      this.logger.debug(`[MOCK] Updating user ${username} on router ${routerConfig.managementIp}`);
      return true;
    }

    return true;
  }

  /**
   * Delete/disable a user on the router.
   */
  async deleteUser(routerConfig: any, username: string): Promise<boolean> {
    if (this.mode === 'mock') {
      this.logger.debug(`[MOCK] Deleting user ${username} from router ${routerConfig.managementIp}`);
      return true;
    }

    return true;
  }

  /**
   * Get active sessions from the router.
   */
  async getActiveSessions(routerConfig: any): Promise<any[]> {
    if (this.mode === 'mock') {
      return this.mockSessions();
    }

    return [];
  }

  /**
   * Mock health response for development.
   */
  private mockHealth(host: string): RouterHealthStatus {
    return {
      online: true,
      identity: 'Net-On Main Gateway',
      version: '7.14.3',
      uptime: '15d 04:32:18',
      cpuLoad: 12,
      freeMemory: 180 * 1024 * 1024,
      totalMemory: 256 * 1024 * 1024,
      activeSessions: 48,
    };
  }

  /**
   * Mock active sessions.
   */
  private mockSessions(): any[] {
    return [
      { user: 'NET-000001', ipAddress: '10.10.1.101', macAddress: 'AA:BB:CC:DD:EE:01', uptime: '02:15:33', bytesIn: 1524000000, bytesOut: 8240000000 },
      { user: 'NET-000002', ipAddress: '10.10.1.102', macAddress: 'AA:BB:CC:DD:EE:02', uptime: '05:42:11', bytesIn: 3210000000, bytesOut: 12400000000 },
      { user: 'NET-000003', ipAddress: '10.10.1.103', macAddress: 'AA:BB:CC:DD:EE:03', uptime: '00:45:08', bytesIn: 524000000, bytesOut: 1820000000 },
    ];
  }
}
