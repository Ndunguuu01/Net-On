// ============================================
// Net-On API — Package Service Unit Test
// ============================================

import { Test, TestingModule } from '@nestjs/testing';
import { PackageService } from './services/package.service';
import { NetworkProfileService } from './services/network-profile.service';
import { PrismaService } from '../../database/prisma.service';

describe('PackageService', () => {
  let service: PackageService;

  const mockPackageRepo = {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  const mockNetworkProfileService = {
    findOrCreateProfile: jest.fn().mockResolvedValue({
      id: 'profile-uuid-1',
      name: 'NET-PROFILE-HOME-FIBER-20M',
      rateLimitString: '20M/20M',
    }),
    formatRateLimit: jest.fn().mockReturnValue('20M/20M'),
  };

  const mockPrismaService = {
    internetPackage: mockPackageRepo,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackageService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NetworkProfileService, useValue: mockNetworkProfileService },
      ],
    }).compile();

    service = module.get<PackageService>(PackageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should generate RouterOS rate limit string and create package with network profile', async () => {
      mockPackageRepo.findFirst.mockResolvedValue(null);

      const mockPkg = {
        id: 'pkg-uuid-1',
        name: 'Home Fiber 20M',
        price: '3000',
        downloadSpeed: 20,
        uploadSpeed: 20,
        networkProfileId: 'profile-uuid-1',
        status: 'ACTIVE',
      };
      mockPackageRepo.create.mockResolvedValue(mockPkg);

      const result = await service.create({
        name: 'Home Fiber 20M',
        price: 3000,
        downloadSpeed: 20,
        uploadSpeed: 20,
        speedUnit: 'Mbps',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Home Fiber 20M');
      expect(mockNetworkProfileService.findOrCreateProfile).toHaveBeenCalledWith(
        'Home Fiber 20M',
        20,
        20,
        'Mbps',
        undefined,
        undefined,
      );
    });
  });

  describe('findAll', () => {
    it('should return all non-archived packages', async () => {
      mockPackageRepo.findMany.mockResolvedValue([
        {
          id: 'pkg-uuid-1',
          name: 'Home Fiber 20M',
          price: '3000',
          status: 'ACTIVE',
        },
      ]);

      const result = await service.findAll({});
      expect(result).toHaveLength(1);
      expect(mockPackageRepo.findMany).toHaveBeenCalled();
    });
  });
});
