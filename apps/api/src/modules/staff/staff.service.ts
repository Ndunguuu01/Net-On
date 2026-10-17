// ============================================
// Net-On API — Staff Service
// ============================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from '../auth/services/password.service';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async create(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    department?: string;
    specialization?: string;
  }) {
    // Check for duplicate email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException(`Email ${dto.email} is already in use`);
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(dto.password);

    // Create user + staff member in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: dto.role,
          isActive: true,
        },
      });

      const staffMember = await tx.staffMember.create({
        data: {
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          department: dto.department || 'Operations',
          specialization: dto.specialization,
          status: 'ACTIVE',
          hireDate: new Date(),
        },
      });

      return {
        ...staffMember,
        user: { id: user.id, email: user.email, role: user.role },
      };
    });

    this.logger.log(`Staff member "${dto.firstName} ${dto.lastName}" created with role ${dto.role}`);
    return result;
  }

  async findAll(query: { page?: number; limit?: number; status?: string; department?: string; role?: string; search?: string }) {
    const { page = 1, limit = 20, status, department, role, search } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (department) where.department = department;
    if (role) where.user = { role };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.staffMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, role: true, isActive: true, lastLoginAt: true } },
        },
      }),
      this.prisma.staffMember.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const member = await this.prisma.staffMember.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true } },
      },
    });
    if (!member) throw new NotFoundException(`Staff member ${id} not found`);
    return member;
  }

  async update(id: string, dto: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: string;
    specialization?: string;
    role?: string;
    status?: string;
  }) {
    const member = await this.prisma.staffMember.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!member) throw new NotFoundException(`Staff member ${id} not found`);

    const { role, status, ...staffData } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Update staff member fields
      const updatedMember = await tx.staffMember.update({
        where: { id },
        data: staffData,
      });

      // Update user role if changed
      if (role) {
        await tx.user.update({
          where: { id: member.userId },
          data: { role },
        });
      }

      // Update user active status if staff status changed
      if (status) {
        await tx.staffMember.update({
          where: { id },
          data: { status },
        });
        await tx.user.update({
          where: { id: member.userId },
          data: { isActive: status === 'ACTIVE' },
        });
      }

      return updatedMember;
    });

    this.logger.log(`Staff member "${member.firstName} ${member.lastName}" updated`);
    return updated;
  }

  async deactivate(id: string) {
    const member = await this.prisma.staffMember.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!member) throw new NotFoundException(`Staff member ${id} not found`);

    await this.prisma.$transaction(async (tx) => {
      await tx.staffMember.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      await tx.user.update({
        where: { id: member.userId },
        data: { isActive: false },
      });
    });

    this.logger.log(`Staff member "${member.firstName} ${member.lastName}" deactivated`);
    return { message: 'Staff member deactivated' };
  }

  async getStats() {
    const [total, active, admins, technicians, support, finance] = await Promise.all([
      this.prisma.staffMember.count(),
      this.prisma.staffMember.count({ where: { status: 'ACTIVE' } }),
      this.prisma.staffMember.count({ where: { user: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } } }),
      this.prisma.staffMember.count({ where: { user: { role: 'TECHNICIAN' } } }),
      this.prisma.staffMember.count({ where: { user: { role: 'SUPPORT' } } }),
      this.prisma.staffMember.count({ where: { user: { role: 'FINANCE' } } }),
    ]);

    // Departments
    const departments = await this.prisma.staffMember.groupBy({
      by: ['department'],
      _count: true,
    });

    return {
      total,
      active,
      byRole: { admins, technicians, support, finance },
      byDepartment: departments.map((d: any) => ({
        department: d.department,
        count: d._count,
      })),
    };
  }
}
