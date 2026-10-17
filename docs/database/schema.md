# Net-On — Database Schema Reference

## Overview
The Net-On platform uses PostgreSQL 16/18 with Prisma ORM.

## Key Design Patterns

1. **UUID Primary Keys**: All tables use 128-bit UUID primary keys (`uuid_generate_v4()`).
2. **Financial Precision**: All monetary values use `DECIMAL(12,2)` — floats are strictly prohibited.
3. **Unique Sequence Formats**:
   - Customer Number: `NET-000001`
   - Invoice Number: `INV-2026-000001`
   - Support Ticket: `TKT-000001`
4. **Soft Delete / Archival**: Customers and packages use status flags (`ARCHIVED`) instead of physical row deletion to preserve historical billing records.
5. **Auditing**: Append-only `audit_logs` table tracking user ID, IP, user-agent, action, and JSON metadata.

## Table Summary

| Table | Map Name | Primary Key | Description |
|-------|----------|-------------|-------------|
| `User` | `users` | UUID | Authentication & RBAC credentials |
| `Customer` | `customers` | UUID | Customer profile & contact info |
| `NetworkProfile` | `network_profiles` | UUID | Bandwidth rate limit specifications |
| `InternetPackage` | `internet_packages` | UUID | Service catalog & pricing |
| `Subscription` | `subscriptions` | UUID | Customer internet package assignments |
| `Invoice` | `invoices` | UUID | Billing statements & line items |
| `InvoiceItem` | `invoice_items` | UUID | Detailed billing charges |
| `Payment` | `payments` | UUID | M-Pesa & manual transactions |
| `Router` | `routers` | UUID | MikroTik network gateway credentials |
| `NetworkAccount` | `network_accounts` | UUID | PPP/Hotspot user accounts |
| `NetworkSession` | `network_sessions` | UUID | Active bandwidth & uptime metrics |
| `NetworkSyncJob` | `network_sync_jobs` | UUID | Asynchronous sync queue records |
| `Notification` | `notifications` | UUID | SMS, Email, In-app message logs |
| `SupportTicket` | `support_tickets` | UUID | Helpdesk tickets |
| `AuditLog` | `audit_logs` | UUID | Security & compliance audit trail |
| `SystemSetting` | `system_settings` | UUID | System configuration key-values |
