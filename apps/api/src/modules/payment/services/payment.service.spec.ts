// ============================================
// Net-On API — Payment Service Unit Tests
// ============================================

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../../database/prisma.service';
import { MpesaService } from './mpesa.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: any;
  let mpesaService: any;
  let configService: any;

  const mockCustomer = {
    id: 'customer-uuid-1',
    customerNumber: 'NET-000001',
    firstName: 'John',
    lastName: 'Doe',
    phone: '254712345678',
  };

  const mockPayment = {
    id: 'payment-uuid-1',
    customerId: 'customer-uuid-1',
    amount: 2500,
    provider: 'MPESA_STK',
    transactionReference: 'STK-TESTREF123',
    status: 'PENDING',
    providerTransactionId: 'ws_CO_12345',
  };

  beforeEach(async () => {
    prisma = {
      customer: {
        findUnique: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      invoice: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
    };

    mpesaService = {
      initiateSTKPush: jest.fn().mockResolvedValue({
        success: true,
        checkoutRequestId: 'ws_CO_12345',
        merchantRequestId: 'MR_12345',
        responseDescription: 'Success. Request accepted for processing',
      }),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'MPESA_WEBHOOK_SECRET') return undefined;
        if (key === 'NODE_ENV') return 'test';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: MpesaService, useValue: mpesaService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateSTKPush', () => {
    it('should initiate STK push and create pending payment record', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.payment.create.mockResolvedValue(mockPayment);

      const result = await service.initiateSTKPush({
        customerId: mockCustomer.id,
        amount: 2500,
        phoneNumber: '254712345678',
      });

      expect(result).toBeDefined();
      expect(result.stkResult.success).toBe(true);
      expect(mpesaService.initiateSTKPush).toHaveBeenCalledWith(
        '254712345678',
        2500,
        mockCustomer.customerNumber,
        expect.any(String),
      );
    });

    it('should throw NotFoundException if customer does not exist', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.initiateSTKPush({
          customerId: 'nonexistent',
          amount: 1000,
          phoneNumber: '254700000000',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordManual', () => {
    it('should record manual payment when reference is unique', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.create.mockResolvedValue({
        ...mockPayment,
        provider: 'CASH',
        status: 'COMPLETED',
      });

      const result = await service.recordManual({
        customerId: mockCustomer.id,
        amount: 3000,
        provider: 'CASH',
        transactionReference: 'MANUAL-REF-001',
      });

      expect(result).toBeDefined();
      expect(prisma.payment.create).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate transaction reference', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.payment.findUnique.mockResolvedValue(mockPayment);

      await expect(
        service.recordManual({
          customerId: mockCustomer.id,
          amount: 3000,
          provider: 'CASH',
          transactionReference: 'DUPLICATE-REF',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('handleMpesaCallback', () => {
    it('should process successful callback and update payment to COMPLETED', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.payment.update.mockResolvedValue({ ...mockPayment, status: 'COMPLETED' });

      const callbackPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'MR_12345',
            CheckoutRequestID: 'ws_CO_12345',
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 2500 },
                { Name: 'MpesaReceiptNumber', Value: 'QK12345678' },
                { Name: 'PhoneNumber', Value: 254712345678 },
              ],
            },
          },
        },
      };

      await service.handleMpesaCallback(callbackPayload);

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPayment.id },
          data: expect.objectContaining({
            status: 'COMPLETED',
            providerTransactionId: 'QK12345678',
          }),
        }),
      );
    });

    it('should be idempotent and not process already COMPLETED payment', async () => {
      prisma.payment.findFirst.mockResolvedValue({ ...mockPayment, status: 'COMPLETED' });

      const callbackPayload = {
        Body: {
          stkCallback: {
            CheckoutRequestID: 'ws_CO_12345',
            ResultCode: 0,
            CallbackMetadata: { Item: [] },
          },
        },
      };

      await service.handleMpesaCallback(callbackPayload);
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when webhook secret is configured but token is missing', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'MPESA_WEBHOOK_SECRET') return 'configured-secret-token';
        if (key === 'NODE_ENV') return 'test';
        return undefined;
      });

      const callbackPayload = {
        Body: {
          stkCallback: {
            CheckoutRequestID: 'ws_CO_12345',
            ResultCode: 0,
            CallbackMetadata: { Item: [] },
          },
        },
      };

      await expect(
        service.handleMpesaCallback(callbackPayload, undefined),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
