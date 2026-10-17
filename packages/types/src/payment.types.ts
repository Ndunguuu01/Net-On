// ============================================
// Net-On — Payment Provider Types
// ============================================

export interface InitiatePaymentParams {
  invoiceId: string;
  amount: number;
  phoneNumber: string;
  accountReference: string;
  description: string;
}

export interface PaymentInitResult {
  success: boolean;
  providerReference: string;
  message: string;
}

export interface PaymentCallbackResult {
  success: boolean;
  transactionReference: string;
  providerTransactionId: string;
  amount: number;
  phoneNumber: string;
  status: 'SUCCESS' | 'FAILED';
  rawData: Record<string, unknown>;
}

export interface TransactionVerification {
  verified: boolean;
  status: string;
  amount: number;
}
