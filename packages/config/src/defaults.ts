// ============================================
// Net-On — Environment Configuration Defaults
// ============================================

export const defaults = {
  app: {
    name: 'Net-On',
    port: 3001,
    apiPrefix: 'api/v1',
    corsOrigins: 'http://localhost:3000',
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'neton',
    user: 'neton',
  },
  redis: {
    host: 'localhost',
    port: 6379,
  },
  jwt: {
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },
  mikrotik: {
    apiPort: 8728,
    connectionTimeout: 10_000,
    commandTimeout: 30_000,
  },
  mpesa: {
    sandboxUrl: 'https://sandbox.safaricom.co.ke',
    productionUrl: 'https://api.safaricom.co.ke',
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  rateLimit: {
    ttl: 60,
    limit: 100,
    authTtl: 60,
    authLimit: 5,
  },
  billing: {
    gracePeriodDays: 3,
    invoiceGenerationDaysBefore: 7,
    reminderDaysBeforeExpiry: [7, 3, 1],
  },
  network: {
    syncMaxRetries: 5,
    healthCheckIntervalMs: 300_000, // 5 min
  },
} as const;

export type AppDefaults = typeof defaults;
