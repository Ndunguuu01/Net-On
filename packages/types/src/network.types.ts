// ============================================
// Net-On — Network Types
// ============================================

import {
  NetworkAccountStatus,
  NetworkSyncStatus,
  NetworkSyncOperation,
  RouterStatus,
  AuthenticationMethod,
} from '@neton/shared';

export interface NetworkAccount {
  id: string;
  customerId: string;
  username: string;
  authenticationMethod: AuthenticationMethod;
  routerId: string;
  networkProfileId: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  status: NetworkAccountStatus;
  syncStatus: NetworkSyncStatus;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkProfile {
  id: string;
  name: string;
  description: string | null;
  downloadSpeed: number;
  uploadSpeed: number;
  speedUnit: string;
  rateLimitString: string;
  burstConfig: string | null;
  addressPool: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Router {
  id: string;
  name: string;
  managementIp: string;
  apiPort: number;
  location: string | null;
  status: RouterStatus;
  lastHealthCheck: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RouterHealthStatus {
  routerId: string;
  routerName: string;
  status: RouterStatus;
  cpuUsage: number;
  memoryUsage: number;
  uptime: string;
  activeUsers: number;
  lastCheck: string;
}

export interface NetworkSession {
  id: string;
  networkAccountId: string;
  sessionId: string;
  ipAddress: string | null;
  macAddress: string | null;
  bytesIn: number;
  bytesOut: number;
  uptimeSeconds: number;
  startedAt: string;
  endedAt: string | null;
}

export interface NetworkSyncJob {
  id: string;
  networkAccountId: string;
  routerId: string;
  operation: NetworkSyncOperation;
  status: NetworkSyncStatus;
  retryCount: number;
  maxRetries: number;
  errorMessage: string | null;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

/** Network adapter interface results */
export interface NetworkOperationResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface ConnectionTestResult {
  connected: boolean;
  latencyMs: number;
  routerIdentity?: string;
  routerVersion?: string;
  error?: string;
}
