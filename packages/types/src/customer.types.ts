// ============================================
// Net-On — Customer Types
// ============================================

import { CustomerStatus } from '@neton/shared';

export interface Customer {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  installationAddress: string | null;
  location: string | null;
  status: CustomerStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummary {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: CustomerStatus;
  packageName?: string;
  subscriptionStatus?: string;
  expiryDate?: string;
}

export interface CustomerProfile extends Customer {
  subscription?: {
    id: string;
    packageName: string;
    status: string;
    startDate: string;
    expiryDate: string;
  };
  networkAccount?: {
    username: string;
    status: string;
    syncStatus: string;
    routerName: string;
    ipAddress?: string;
    macAddress?: string;
    lastSyncedAt?: string;
  };
  billing?: {
    totalPaid: number;
    outstandingBalance: number;
    lastPaymentDate?: string;
    lastPaymentAmount?: number;
  };
}
