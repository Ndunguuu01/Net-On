// ============================================
// Net-On API — Package Service
// ============================================
// Internet package catalog CRUD and pricing.
// ============================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NetworkProfileService } from './network-profile.service';
import {
  CreatePackageDto,
  UpdatePackageDto,
  QueryPackageDto,
} from '../dto/package.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PackageService {
  private readonly logger = new Logger(PackageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly networkProfileService: NetworkProfileService,
  ) {}

  /**
   * Create a new internet package.
   */
  async create(dto: CreatePackageDto) {
    const existing = await this.prisma.internetPackage.findFirst({
      where: {
        name: { equals: dto.name, mode: 'insensitive' },
        status: { not: 'ARCHIVED' },
      },
    });

    if (existing) {
      throw new ConflictException(
        `An active internet package with the name "${dto.name}" already exists`,
      );
    }

    // Find or create associated network profile
    const profile = await this.networkProfileService.findOrCreateProfile(
      dto.name,
      dto.uploadSpeed,
      dto.downloadSpeed,
      dto.speedUnit,
      dto.burstConfig,
      dto.addressPool,
    );

    const pkg = await this.prisma.internetPackage.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: new Prisma.Decimal(dto.price),
        billingCycle: dto.billingCycle || 'MONTHLY',
        durationDays: dto.durationDays || 30,
        downloadSpeed: dto.downloadSpeed,
        uploadSpeed: dto.uploadSpeed,
        speedUnit: dto.speedUnit || 'Mbps',
        gracePeriodDays: dto.gracePeriodDays ?? 3,
        networkProfileId: profile.id,
        status: 'ACTIVE',
      },
      include: {
        networkProfile: true,
      },
    });

    this.logger.log(`Package "${pkg.name}" (KSh ${pkg.price}) created successfully`);
    return pkg;
  }

  /**
   * List all internet packages with subscription count.
   */
  async findAll(query: QueryPackageDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = { not: 'ARCHIVED' };
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    return this.prisma.internetPackage.findMany({
      where,
      orderBy: { price: 'asc' },
      include: {
        networkProfile: true,
        _count: {
          select: {
            subscriptions: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });
  }

  /**
   * Find a single package by ID.
   */
  async findOne(id: string) {
    const pkg = await this.prisma.internetPackage.findUnique({
      where: { id },
      include: {
        networkProfile: true,
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException(`Internet package with ID ${id} not found`);
    }

    return pkg;
  }

  /**
   * Update package details and rate limits.
   */
  async update(id: string, dto: UpdatePackageDto) {
    const pkg = await this.prisma.internetPackage.findUnique({ where: { id } });
    if (!pkg) {
      throw new NotFoundException(`Internet package with ID ${id} not found`);
    }

    const data: any = { ...dto };
    if (dto.price !== undefined) {
      data.price = new Prisma.Decimal(dto.price);
    }

    // Update or recreate network profile if speeds changed
    if (dto.downloadSpeed || dto.uploadSpeed) {
      const dl = dto.downloadSpeed || pkg.downloadSpeed;
      const ul = dto.uploadSpeed || pkg.uploadSpeed;
      const unit = dto.speedUnit || pkg.speedUnit;

      const profile = await this.networkProfileService.findOrCreateProfile(
        dto.name || pkg.name,
        ul,
        dl,
        unit,
      );
      data.networkProfileId = profile.id;
    }

    return this.prisma.internetPackage.update({
      where: { id },
      data,
      include: {
        networkProfile: true,
      },
    });
  }

  /**
   * Archive / soft-delete package.
   */
  async remove(id: string) {
    const pkg = await this.prisma.internetPackage.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException(`Internet package with ID ${id} not found`);
    }

    if (pkg._count.subscriptions > 0) {
      throw new ConflictException(
        `Cannot archive package "${pkg.name}" because it has ${pkg._count.subscriptions} active subscription(s)`,
      );
    }

    await this.prisma.internetPackage.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    this.logger.log(`Package "${pkg.name}" archived`);
    return { message: 'Package archived successfully' };
  }
}
