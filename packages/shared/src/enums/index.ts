// ============================================
// Net-On — Shared Enums
// ============================================
// These enums are the single source of truth for
// status values used across the API and frontend.
// ============================================

/** User roles for RBAC */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  FINANCE = 'FINANCE',
  TECHNICIAN = 'TECHNICIAN',
  SUPPORT = 'SUPPORT',
  CUSTOMER = 'CUSTOMER',
}

/** Customer statuses */
export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

/** Internet package statuses */
export enum PackageStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

/** Billing cycles */
export enum BillingCycle {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

/** Speed units */
export enum SpeedUnit {
  KBPS = 'Kbps',
  MBPS = 'Mbps',
  GBPS = 'Gbps',
}

/** Subscription statuses */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING = 'EXPIRING',
  EXPIRED = 'EXPIRED',
  GRACE_PERIOD = 'GRACE_PERIOD',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

/** Invoice statuses */
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

/** Payment statuses */
export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
  REFUNDED = 'REFUNDED',
}

/** Payment providers */
export enum PaymentProvider {
  MPESA = 'MPESA',
  MANUAL = 'MANUAL',
  MOCK = 'MOCK',
}

/** Payment reconciliation statuses */
export enum ReconciliationStatus {
  PENDING = 'PENDING',
  RECONCILED = 'RECONCILED',
  DISPUTED = 'DISPUTED',
  FAILED = 'FAILED',
}

/** Network account statuses */
export enum NetworkAccountStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
  FAILED = 'FAILED',
}

/** Network sync statuses */
export enum NetworkSyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

/** Network sync operations */
export enum NetworkSyncOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  ENABLE = 'ENABLE',
  DISABLE = 'DISABLE',
  DISCONNECT = 'DISCONNECT',
}

/** Router statuses */
export enum RouterStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  DEGRADED = 'DEGRADED',
  MAINTENANCE = 'MAINTENANCE',
}

/** Authentication methods for network accounts */
export enum AuthenticationMethod {
  PPP_SECRET = 'PPP_SECRET',
  HOTSPOT_USER = 'HOTSPOT_USER',
  RADIUS = 'RADIUS',
}

/** Notification channels */
export enum NotificationChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  WHATSAPP = 'WHATSAPP',
}

/** Notification types */
export enum NotificationType {
  CUSTOMER_REGISTERED = 'CUSTOMER_REGISTERED',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  INTERNET_SUSPENDED = 'INTERNET_SUSPENDED',
  INTERNET_RESTORED = 'INTERNET_RESTORED',
}

/** Notification delivery statuses */
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ',
}

/** Support ticket statuses */
export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_ON_CUSTOMER = 'WAITING_ON_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

/** Support ticket priorities */
export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/** Audit log actions */
export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SUSPEND = 'SUSPEND',
  REACTIVATE = 'REACTIVATE',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  ROLE_CHANGE = 'ROLE_CHANGE',
  NETWORK_SYNC = 'NETWORK_SYNC',
  MANUAL_OVERRIDE = 'MANUAL_OVERRIDE',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE',
}

/** Audit result */
export enum AuditResult {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  DENIED = 'DENIED',
}
