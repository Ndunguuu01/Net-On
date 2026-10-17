// ============================================
// Net-On — Billing & Payment Types
// ============================================

import {
  InvoiceStatus,
  PaymentStatus,
  PaymentProvider,
  ReconciliationStatus,
  SubscriptionStatus,
  BillingCycle,
} from '@neton/shared';

export interface InternetPackage {
  id: string;
  name: string;
  description: string | null;
  price: number; // in cents
  billingCycle: BillingCycle;
  durationDays: number;
  downloadSpeed: number;
  uploadSpeed: number;
  speedUnit: string;
  gracePeriodDays: number;
  networkProfileId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  packageId: string;
  startDate: string;
  expiryDate: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  gracePeriodDays: number;
  createdAt: string;
  updatedAt: string;
  package?: InternetPackage;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subscriptionId: string | null;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  customerId: string;
  invoiceId: string | null;
  amount: number;
  provider: PaymentProvider;
  transactionReference: string;
  providerTransactionId: string | null;
  phoneNumber: string | null;
  status: PaymentStatus;
  reconciliationStatus: ReconciliationStatus;
  paidAt: string | null;
  createdAt: string;
}
