// ============================================
// Net-On API — Customer Service Unit Test
// ============================================

import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './services/customer.service';
import { CustomerNumberService } from './services/customer-number.service';
import { PasswordService } from '../auth/services/password.service';
import { PrismaService } from '../../database/prisma.service';

describe('CustomerService', () => {
  let service: CustomerService;

  const mockCustomerRepo = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  };

  const mockUserRepo = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  const mockPrismaService = {
    customer: mockCustomerRepo,
    user: mockUserRepo,
    $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) =>
      cb({ customer: mockCustomerRepo, user: mockUserRepo }),
    ),
  };

  const mockCustomerNumberService = {
    generateNext: jest.fn().mockResolvedValue('NET-000001'),
  };

  const mockPasswordService = {
    hash: jest.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$hash'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CustomerNumberService, useValue: mockCustomerNumberService },
        { provide: PasswordService, useValue: mockPasswordService },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should normalize KE phone number and create customer with NET-000001 number', async () => {
      mockCustomerRepo.findUnique.mockResolvedValue(null);
      mockUserRepo.findUnique.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: '254712345678@customer.neton.internal',
      });

      const mockCustomer = {
        id: 'cust-uuid-1',
        customerNumber: 'NET-000001',
        firstName: 'John',
        lastName: 'Kamau',
        phone: '254712345678',
        status: 'ACTIVE',
      };
      mockCustomerRepo.create.mockResolvedValue(mockCustomer);

      const result = await service.create({
        firstName: 'John',
        lastName: 'Kamau',
        phone: '0712345678',
      });

      expect(result).toBeDefined();
      expect(result.customerNumber).toBe('NET-000001');
      expect(result.phone).toBe('254712345678');
      expect(mockCustomerNumberService.generateNext).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated items and meta metadata', async () => {
      mockCustomerRepo.findMany.mockResolvedValue([
        {
          id: 'cust-uuid-1',
          customerNumber: 'NET-000001',
          firstName: 'John',
          lastName: 'Kamau',
          phone: '254712345678',
          status: 'ACTIVE',
        },
      ]);
      mockCustomerRepo.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
