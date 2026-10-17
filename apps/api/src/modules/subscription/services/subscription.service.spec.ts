// ============================================
// Net-On API — Subscription Service Unit Tests
// ============================================

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../../../database/prisma.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prisma: any;

  const mockCustomer = {
    id: 'customer-uuid-1',
    customerNumber: 'NET-000001',
    firstName: 'Jane',
    lastName: 'Doe',
  };

  const mockPackage = {
    id: 'package-uuid-1',
    name: 'Home Fiber 20M',
    price: 3000,
    durationDays: 30,
    gracePeriodDays: 3,
    status: 'ACTIVE',
  };

  const mockSubscription = {
    id: 'sub-uuid-1',
    customerId: 'customer-uuid-1',
    packageId: 'package-uuid-1',
    startDate: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'ACTIVE',
    autoRenew: true,
    gracePeriodDays: 3,
    customer: mockCustomer,
    package: mockPackage,
  };

  beforeEach(async () => {
    prisma = {
      customer: {
        findUnique: jest.fn(),
      },
      internetPackage: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      subscription: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an active subscription when package and customer are valid', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.internetPackage.findUnique.mockResolvedValue(mockPackage);
      prisma.subscription.findFirst.mockResolvedValue(null);
      prisma.subscription.create.mockResolvedValue(mockSubscription);

      const result = await service.create({
        customerId: mockCustomer.id,
        packageId: mockPackage.id,
        autoRenew: true,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('ACTIVE');
      expect(prisma.subscription.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if customer is not found', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          customerId: 'invalid-customer',
          packageId: mockPackage.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if package is inactive', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.internetPackage.findUnique.mockResolvedValue({ ...mockPackage, status: 'INACTIVE' });

      await expect(
        service.create({
          customerId: mockCustomer.id,
          packageId: mockPackage.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if customer already has an active subscription', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.internetPackage.findUnique.mockResolvedValue(mockPackage);
      prisma.subscription.findFirst.mockResolvedValue(mockSubscription);

      await expect(
        service.create({
          customerId: mockCustomer.id,
          packageId: mockPackage.id,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('renew', () => {
    it('should renew an expired subscription and set new expiry date', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        ...mockSubscription,
        status: 'EXPIRED',
      });
      prisma.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: 'ACTIVE',
      });

      const result = await service.renew(mockSubscription.id);
      expect(result).toBeDefined();
      expect(result.status).toBe('ACTIVE');
      expect(prisma.subscription.update).toHaveBeenCalled();
    });
  });

  describe('processExpiryChecks', () => {
    it('should transition expired subscriptions to GRACE_PERIOD and EXPIRED', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      prisma.subscription.findMany.mockResolvedValueOnce([
        { id: 'sub-1', expiryDate: pastDate, gracePeriodDays: 3 },
      ]);
      prisma.subscription.findMany.mockResolvedValueOnce([]);
      prisma.subscription.findMany.mockResolvedValueOnce([]);
      prisma.subscription.update.mockResolvedValue({});

      const result = await service.processExpiryChecks();
      expect(result.movedToGrace).toBe(1);
    });
  });
});
