// ============================================
// Net-On API — Subscription Service
// ============================================
// Manages subscription lifecycle: create, renew,
// suspend, expire, and grace period handling.
// ============================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  RenewSubscriptionDto,
  QuerySubscriptionDto,
} from '../dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new subscription for a customer.
   */
  async create(dto: CreateSubscriptionDto) {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    // Verify package exists and is active
    const pkg = await this.prisma.internetPackage.findUnique({
      where: { id: dto.packageId },
    });
    if (!pkg) {
      throw new NotFoundException(`Package ${dto.packageId} not found`);
    }
    if (pkg.status !== 'ACTIVE') {
      throw new BadRequestException(`Package ${pkg.name} is not active`);
    }

    // Check for existing active subscription
    const existing = await this.prisma.subscription.findFirst({
      where: {
        customerId: dto.customerId,
        status: { in: ['ACTIVE', 'GRACE'] },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Customer already has an active subscription. Expire or cancel it first.`,
      );
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + pkg.durationDays);

    const subscription = await this.prisma.subscription.create({
      data: {
        customerId: dto.customerId,
        packageId: dto.packageId,
        startDate,
        expiryDate,
        autoRenew: dto.autoRenew ?? true,
        gracePeriodDays: pkg.gracePeriodDays,
        status: 'ACTIVE',
      },
      include: {
        customer: { select: { customerNumber: true, firstName: true, lastName: true } },
        package: true,
      },
    });

    this.logger.log(
      `Subscription created for ${subscription.customer.customerNumber} → ${pkg.name}`,
    );

    return subscription;
  }

  /**
   * List subscriptions with pagination, filters, and search.
   */
  async findAll(query: QuerySubscriptionDto) {
    const {
      page = 1,
      limit = 20,
      status,
      customerId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    if (search) {
      where.customer = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { customerNumber: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: {
              id: true,
              customerNumber: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
              price: true,
              downloadSpeed: true,
              uploadSpeed: true,
              speedUnit: true,
              durationDays: true,
            },
          },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single subscription with full details.
   */
  async findOne(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: true,
        package: true,
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }
    return subscription;
  }

  /**
   * Update subscription (e.g., toggle auto-renew, change package).
   */
  async update(id: string, dto: UpdateSubscriptionDto) {
    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }

    const data: any = {};
    if (dto.autoRenew !== undefined) data.autoRenew = dto.autoRenew;
    if (dto.packageId) {
      const pkg = await this.prisma.internetPackage.findUnique({
        where: { id: dto.packageId },
      });
      if (!pkg) throw new NotFoundException(`Package ${dto.packageId} not found`);
      data.packageId = dto.packageId;
    }

    return this.prisma.subscription.update({ where: { id }, data });
  }

  /**
   * Renew an expired or grace-period subscription.
   */
  async renew(id: string, dto?: RenewSubscriptionDto) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: { package: true },
    });
    if (!sub) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }

    const pkg = dto?.packageId
      ? await this.prisma.internetPackage.findUniqueOrThrow({ where: { id: dto.packageId } })
      : sub.package;

    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + pkg.durationDays);

    const renewed = await this.prisma.subscription.update({
      where: { id },
      data: {
        packageId: pkg.id,
        startDate,
        expiryDate,
        status: 'ACTIVE',
        gracePeriodDays: pkg.gracePeriodDays,
      },
      include: { customer: true, package: true },
    });

    this.logger.log(`Subscription ${id} renewed → ${pkg.name}`);
    return renewed;
  }

  /**
   * Suspend a subscription.
   */
  async suspend(id: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException(`Subscription ${id} not found`);

    return this.prisma.subscription.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });
  }

  /**
   * Expire a subscription.
   */
  async expire(id: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException(`Subscription ${id} not found`);

    return this.prisma.subscription.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });
  }

  /**
   * Get subscription stats for dashboard.
   */
  async getStats() {
    const [active, grace, expired, suspended, total] = await Promise.all([
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'GRACE' } }),
      this.prisma.subscription.count({ where: { status: 'EXPIRED' } }),
      this.prisma.subscription.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.subscription.count(),
    ]);

    return { active, grace, expired, suspended, total };
  }

  /**
   * Automated subscription lifecycle expiry check.
   * Transitions subscriptions:
   * ACTIVE -> GRACE_PERIOD -> EXPIRED -> SUSPENDED
   */
  async processExpiryChecks() {
    const now = new Date();
    let movedToGrace = 0;
    let movedToExpired = 0;
    let movedToSuspended = 0;

    // 1. Move expired ACTIVE/EXPIRING to GRACE_PERIOD
    const expiredActive = await this.prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'EXPIRING'] },
        expiryDate: { lt: now },
      },
    });

    for (const sub of expiredActive) {
      const graceEnd = new Date(sub.expiryDate);
      graceEnd.setDate(graceEnd.getDate() + (sub.gracePeriodDays || 3));

      if (now <= graceEnd) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'GRACE_PERIOD' },
        });
        movedToGrace++;
      } else {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' },
        });
        movedToExpired++;
      }
    }

    // 2. Move overdue GRACE_PERIOD to EXPIRED
    const overdueGrace = await this.prisma.subscription.findMany({
      where: { status: 'GRACE_PERIOD' },
    });

    for (const sub of overdueGrace) {
      const graceEnd = new Date(sub.expiryDate);
      graceEnd.setDate(graceEnd.getDate() + (sub.gracePeriodDays || 3));

      if (now > graceEnd) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' },
        });
        movedToExpired++;
      }
    }

    // 3. Move long-expired (e.g. > 7 days after expiry) to SUSPENDED
    const longExpiredCutoff = new Date(now);
    longExpiredCutoff.setDate(longExpiredCutoff.getDate() - 7);

    const longExpired = await this.prisma.subscription.findMany({
      where: {
        status: 'EXPIRED',
        expiryDate: { lt: longExpiredCutoff },
      },
    });

    for (const sub of longExpired) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'SUSPENDED' },
      });
      movedToSuspended++;
    }

    this.logger.log(
      `[Cron] Lifecycle check completed: ${movedToGrace} grace, ${movedToExpired} expired, ${movedToSuspended} suspended`,
    );

    return { movedToGrace, movedToExpired, movedToSuspended };
  }
}

