// ============================================
// Net-On API — Customer Service
// ============================================
// Customer lifecycle CRUD, search, pagination,
// suspension, and user account association.
// ============================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CustomerNumberService } from './customer-number.service';
import { PasswordService } from '../../auth/services/password.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  QueryCustomerDto,
  SuspendCustomerDto,
} from '../dto/customer.dto';
import { formatPhoneKE } from '@neton/shared';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customerNumberService: CustomerNumberService,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * Create a new customer and associated user account.
   */
  async create(dto: CreateCustomerDto) {
    const phoneFormatted = formatPhoneKE(dto.phone);

    // Check for existing phone number
    const existingPhone = await this.prisma.customer.findUnique({
      where: { phone: phoneFormatted },
    });
    if (existingPhone) {
      throw new ConflictException(
        `A customer with phone number ${phoneFormatted} already exists`,
      );
    }

    // Determine email & check uniqueness
    const email =
      dto.email?.toLowerCase().trim() ||
      `${phoneFormatted}@customer.neton.internal`;

    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException(`User account with email ${email} already exists`);
    }

    const customerNumber = await this.customerNumberService.generateNext();
    const defaultPassword = `NetOn@${phoneFormatted.slice(-4)}`;
    const passwordHash = await this.passwordService.hash(defaultPassword);

    // Execute atomic creation in transaction
    const customer = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'CUSTOMER',
          isActive: true,
        },
      });

      return tx.customer.create({
        data: {
          userId: user.id,
          customerNumber,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: phoneFormatted,
          email: dto.email ? dto.email.toLowerCase().trim() : null,
          address: dto.address,
          installationAddress: dto.installationAddress,
          location: dto.location,
          notes: dto.notes,
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });
    });

    this.logger.log(
      `Customer ${customer.customerNumber} (${customer.firstName} ${customer.lastName}) created successfully`,
    );

    return customer;
  }

  /**
   * List customers with pagination, text search, and status filter.
   */
  async findAll(query: QueryCustomerDto) {
    const { page = 1, limit = 20, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { package: true },
            take: 1,
          },
          networkAccount: {
            select: {
              id: true,
              username: true,
              ipAddress: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a single customer by ID with full relations.
   */
  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: { package: true },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        networkAccount: {
          include: {
            networkProfile: true,
            router: {
              select: {
                id: true,
                name: true,
                managementIp: true,
              },
            },
          },
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  /**
   * Update customer details.
   */
  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const data: any = { ...dto };

    if (dto.phone) {
      data.phone = formatPhoneKE(dto.phone);
      if (data.phone !== customer.phone) {
        const existing = await this.prisma.customer.findUnique({
          where: { phone: data.phone },
        });
        if (existing) {
          throw new ConflictException(
            `Phone number ${data.phone} is already used by another customer`,
          );
        }
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  /**
   * Suspend customer.
   */
  async suspend(id: string, dto?: SuspendCustomerDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        notes: dto?.reason
          ? `${customer.notes ? customer.notes + '\n' : ''}[SUSPENDED ${new Date().toISOString()}] Reason: ${dto.reason}`
          : customer.notes,
      },
    });

    this.logger.warn(`Customer ${customer.customerNumber} suspended`);
    return updated;
  }

  /**
   * Reactivate suspended customer.
   */
  async reactivate(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        notes: `${customer.notes ? customer.notes + '\n' : ''}[REACTIVATED ${new Date().toISOString()}]`,
      },
    });

    this.logger.log(`Customer ${customer.customerNumber} reactivated`);
    return updated;
  }

  /**
   * Soft delete / archive customer.
   */
  async remove(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Set status to ARCHIVED and deactivate associated user
    await this.prisma.$transaction([
      this.prisma.customer.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      }),
      this.prisma.user.update({
        where: { id: customer.userId },
        data: { isActive: false },
      }),
    ]);

    this.logger.log(`Customer ${customer.customerNumber} archived`);
    return { message: 'Customer archived successfully' };
  }
}
