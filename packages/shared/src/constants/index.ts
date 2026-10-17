// ============================================
// Net-On — Shared Constants
// ============================================

/** Customer number prefix */
export const CUSTOMER_NUMBER_PREFIX = 'NET';

/** Invoice number prefix */
export const INVOICE_NUMBER_PREFIX = 'INV';

/** Support ticket number prefix */
export const TICKET_NUMBER_PREFIX = 'TKT';

/** Default pagination */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Grace period default (days) */
export const DEFAULT_GRACE_PERIOD_DAYS = 3;

/** Network sync retry settings */
export const NETWORK_SYNC_MAX_RETRIES = 5;
export const NETWORK_SYNC_RETRY_DELAYS = [0, 30_000, 120_000, 600_000, 1_800_000]; // ms

/** MikroTik connection defaults */
export const MIKROTIK_DEFAULT_API_PORT = 8728;
export const MIKROTIK_CONNECTION_TIMEOUT = 10_000; // ms
export const MIKROTIK_COMMAND_TIMEOUT = 30_000; // ms

/** JWT defaults */
export const JWT_ACCESS_DEFAULT_EXPIRY = '15m';
export const JWT_REFRESH_DEFAULT_EXPIRY = '7d';

/** Rate limiting */
export const AUTH_RATE_LIMIT_TTL = 60; // seconds
export const AUTH_RATE_LIMIT_MAX = 5; // attempts
export const ACCOUNT_LOCKOUT_ATTEMPTS = 5;
export const ACCOUNT_LOCKOUT_DURATION = 15 * 60; // 15 minutes in seconds

/** Currency */
export const CURRENCY_CODE = 'KES';
export const CURRENCY_SYMBOL = 'KSh';
