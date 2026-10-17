// ============================================
// Net-On API — Support Ticket Service
// ============================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: {
    customerId: string;
    subject: string;
    description: string;
    category?: string;
    priority?: string;
  }) {
    // Generate ticket number
    const count = await this.prisma.supportTicket.count();
    const ticketNumber = `TKT-${String(count + 1).padStart(5, '0')}`;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        customerId: dto.customerId,
        ticketNumber,
        subject: dto.subject,
        description: dto.description,
        category: dto.category || 'GENERAL',
        priority: dto.priority || 'MEDIUM',
        status: 'OPEN',
      },
      include: {
        customer: { select: { customerNumber: true, firstName: true, lastName: true, phone: true } },
      },
    });

    this.logger.log(`Support ticket ${ticketNumber} created`);
    return ticket;
  }

  async findAll(query: { page?: number; limit?: number; status?: string; priority?: string; search?: string }) {
    const { page = 1, limit = 20, status, priority, search } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, customerNumber: true, firstName: true, lastName: true, phone: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  async resolve(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);

    return this.prisma.supportTicket.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }

  async close(id: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status: 'CLOSED', resolvedAt: new Date() },
    });
  }

  async getStats() {
    const [open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      this.prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      this.prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
    ]);
    return { open, inProgress, resolved, closed };
  }
}
