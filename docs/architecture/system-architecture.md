# Net-On — System Architecture

## Overview

Net-On uses a **modular monolith** architecture with clear domain boundaries.

See the implementation plan for detailed architecture diagrams and decisions.

## Key Principles

1. **Adapter Pattern** — Abstract interfaces for MikroTik, M-Pesa, SMS/Email
2. **Event-Driven** — Domain events for cross-module communication
3. **Background Processing** — All infrastructure calls via BullMQ
4. **Defense in Depth** — Multi-layer security
5. **Idempotency** — All payment callbacks and network operations
6. **Graceful Degradation** — Network failures don't block payments

## Modules

| Module | Responsibility |
|--------|---------------|
| AuthModule | Authentication, JWT, RBAC |
| CustomerModule | Customer lifecycle |
| PackageModule | Internet packages, network profiles |
| SubscriptionModule | Subscription lifecycle |
| BillingModule | Billing engine orchestration |
| InvoiceModule | Invoice generation |
| PaymentModule | Payment processing, M-Pesa |
| NetworkModule | Network accounts, sync jobs |
| MikrotikModule | MikroTik RouterOS integration |
| NotificationModule | Multi-channel notifications |
| ReportModule | Business reports |
| SupportModule | Support tickets |
| AuditModule | Audit trail |
| SettingsModule | System configuration |
| StaffModule | Staff management |
