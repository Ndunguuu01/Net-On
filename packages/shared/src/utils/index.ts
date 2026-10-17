// ============================================
// Net-On — Shared Utility Functions
// ============================================

/**
 * Format a Kenyan phone number to international format (254XXXXXXXXX).
 * Handles inputs like: 0712345678, +254712345678, 254712345678
 */
export function formatPhoneKE(phone: string): string {
  const cleaned = phone.replace(/[\s\-+]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '254' + cleaned.substring(1);
  }
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.startsWith('+254') && cleaned.length === 13) {
    return cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Format phone for display: 254712345678 → 0712 345 678
 */
export function displayPhoneKE(phone: string): string {
  const formatted = formatPhoneKE(phone);
  if (formatted.length !== 12 || !formatted.startsWith('254')) return phone;
  const local = '0' + formatted.substring(3);
  return `${local.substring(0, 4)} ${local.substring(4, 7)} ${local.substring(7)}`;
}

/**
 * Format money in KES: 150000 (cents) → "KSh 1,500.00"
 */
export function formatMoneyKES(amountInCents: number): string {
  const amount = amountInCents / 100;
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate a padded sequence number: 42 → "000042"
 */
export function padSequence(num: number, length: number = 6): string {
  return String(num).padStart(length, '0');
}

/**
 * Generate a customer number: NET-000042
 */
export function formatCustomerNumber(sequence: number): string {
  return `NET-${padSequence(sequence)}`;
}

/**
 * Generate an invoice number: INV-2026-000042
 */
export function formatInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${padSequence(sequence)}`;
}

/**
 * Generate a ticket number: TKT-000042
 */
export function formatTicketNumber(sequence: number): string {
  return `TKT-${padSequence(sequence)}`;
}

/**
 * Calculate the difference between two dates in days.
 */
export function daysBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is in the past.
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Check if a date is within N days from now.
 */
export function isWithinDays(date: Date, days: number): boolean {
  const now = Date.now();
  const target = date.getTime();
  return target > now && target <= now + days * 24 * 60 * 60 * 1000;
}

/**
 * Mask a phone number for display: 254712345678 → 2547****5678
 */
export function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  return phone.substring(0, 4) + '****' + phone.substring(phone.length - 4);
}

/**
 * Mask an email for display: john@example.com → j***@example.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.charAt(0) + '***';
  return `${masked}@${domain}`;
}

/**
 * Generate a MikroTik-compatible rate limit string.
 * Example: "10M/10M" for 10Mbps down/up
 */
export function formatRateLimit(downloadMbps: number, uploadMbps: number): string {
  return `${downloadMbps}M/${uploadMbps}M`;
}
