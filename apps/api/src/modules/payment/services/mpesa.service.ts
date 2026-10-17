// ============================================
// Net-On API — M-Pesa Daraja Service
// ============================================
// Handles M-Pesa STK Push (Lipa Na M-Pesa).
// Supports 'mock' mode for development without
// real Safaricom credentials.
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';

export interface StkPushResult {
  success: boolean;
  merchantRequestId: string;
  checkoutRequestId: string;
  responseDescription: string;
}

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly mode: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly passkey: string;
  private readonly shortcode: string;
  private readonly callbackBaseUrl: string;
  private readonly apiBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.mode = config.get<string>('MPESA_MODE', 'mock');
    this.consumerKey = config.get<string>('MPESA_CONSUMER_KEY', '');
    this.consumerSecret = config.get<string>('MPESA_CONSUMER_SECRET', '');
    this.passkey = config.get<string>('MPESA_PASSKEY', '');
    this.shortcode = config.get<string>('MPESA_SHORTCODE', '174379');
    this.callbackBaseUrl = config.get<string>('MPESA_CALLBACK_BASE_URL', 'https://localhost');
    this.apiBaseUrl = config.get<string>('MPESA_API_BASE_URL', 'https://sandbox.safaricom.co.ke');

    this.logger.log(`M-Pesa service initialized in ${this.mode.toUpperCase()} mode`);
  }

  /**
   * Initiate an STK Push (Lipa Na M-Pesa Online).
   */
  async initiateSTKPush(
    phoneNumber: string,
    amount: number,
    accountReference: string,
    description: string,
  ): Promise<StkPushResult> {
    if (this.mode === 'mock') {
      return this.mockSTKPush(phoneNumber, amount, accountReference);
    }

    return this.liveSTKPush(phoneNumber, amount, accountReference, description);
  }

  /**
   * Mock STK Push for development.
   */
  private async mockSTKPush(
    phoneNumber: string,
    amount: number,
    accountReference: string,
  ): Promise<StkPushResult> {
    this.logger.debug(
      `[MOCK] STK Push → ${phoneNumber}, KES ${amount}, Ref: ${accountReference}`,
    );

    // Simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      merchantRequestId: `MOCK-MR-${uuid().substring(0, 8).toUpperCase()}`,
      checkoutRequestId: `MOCK-CR-${uuid().substring(0, 8).toUpperCase()}`,
      responseDescription: '[MOCK] STK Push sent successfully. Awaiting user confirmation.',
    };
  }

  /**
   * Live STK Push via Daraja API.
   */
  private async liveSTKPush(
    phoneNumber: string,
    amount: number,
    accountReference: string,
    description: string,
  ): Promise<StkPushResult> {
    try {
      // Step 1: Get access token
      const token = await this.getAccessToken();

      // Step 2: Prepare STK Push payload
      const timestamp = this.getTimestamp();
      const password = Buffer.from(
        `${this.shortcode}${this.passkey}${timestamp}`,
      ).toString('base64');

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: phoneNumber,
        PartyB: this.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: `${this.callbackBaseUrl}/api/v1/payments/mpesa/callback`,
        AccountReference: accountReference,
        TransactionDesc: description || 'Net-On Internet Payment',
      };

      const response = await fetch(
        `${this.apiBaseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data: any = await response.json();

      if (data.ResponseCode === '0') {
        return {
          success: true,
          merchantRequestId: data.MerchantRequestID,
          checkoutRequestId: data.CheckoutRequestID,
          responseDescription: data.ResponseDescription,
        };
      }

      this.logger.error(`STK Push failed: ${JSON.stringify(data)}`);
      return {
        success: false,
        merchantRequestId: data.MerchantRequestID || '',
        checkoutRequestId: data.CheckoutRequestID || '',
        responseDescription: data.ResponseDescription || 'STK Push failed',
      };
    } catch (error: any) {
      this.logger.error(`STK Push error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Daraja API access token.
   */
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

    const response = await fetch(
      `${this.apiBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: 'GET',
        headers: { Authorization: `Basic ${auth}` },
      },
    );

    const data: any = await response.json();
    return data.access_token;
  }

  /**
   * Generate timestamp in format YYYYMMDDHHmmss.
   */
  private getTimestamp(): string {
    const now = new Date();
    return (
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0')
    );
  }
}
