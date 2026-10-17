// ============================================
// Net-On API — Invoice Service
// ============================================
// Generates invoices from subscriptions,
// handles manual creation, and tracks payments.
// ============================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InvoiceNumberService } from './invoice-number.service';
import { CreateInvoiceDto, QueryInvoiceDto, MarkInvoicePaidDto } from '../dto/invoice.dto';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceNumberService: InvoiceNumberService,
  ) {}

  /**
   * Create an invoice manually or from a subscription.
   */
  async create(dto: CreateInvoiceDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    const invoiceNumber = await this.invoiceNumberService.generateNext();
    const now = new Date();
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Calculate totals from items
    const items = dto.items.map((item) => ({
      description: item.description,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice,
      total: (item.quantity || 1) * item.unitPrice,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = dto.discount || 0;
    const tax = 0; // Tax can be added later
    const total = subtotal - discount + tax;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: dto.customerId,
        subscriptionId: dto.subscriptionId || null,
        billingPeriodStart: now,
        billingPeriodEnd: dueDate,
        issueDate: now,
        dueDate,
        subtotal,
        discount,
        tax,
        total,
        amountPaid: 0,
        balance: total,
        status: 'PENDING',
        items: {
          create: items,
        },
      },
      include: {
        customer: {
          select: { customerNumber: true, firstName: true, lastName: true },
        },
        items: true,
      },
    });

    this.logger.log(
      `Invoice ${invoiceNumber} created for ${customer.customerNumber} — KES ${total}`,
    );

    return invoice;
  }

  /**
   * Generate invoices for all active subscriptions approaching expiry.
   */
  async generateBulk() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        expiryDate: { lte: threeDaysFromNow },
      },
      include: { customer: true, package: true },
    });

    const generated: string[] = [];

    for (const sub of subscriptions) {
      // Check if invoice already exists for this subscription period
      const existing = await this.prisma.invoice.findFirst({
        where: {
          subscriptionId: sub.id,
          billingPeriodEnd: { gte: sub.expiryDate },
        },
      });

      if (!existing) {
        const invoice = await this.create({
          customerId: sub.customerId,
          subscriptionId: sub.id,
          items: [
            {
              description: `${sub.package.name} — ${sub.package.durationDays} day subscription renewal`,
              quantity: 1,
              unitPrice: Number(sub.package.price),
            },
          ],
        });
        generated.push(invoice.invoiceNumber);
      }
    }

    this.logger.log(`Bulk invoice generation: ${generated.length} invoices created`);
    return { generated: generated.length, invoiceNumbers: generated };
  }

  /**
   * List invoices with pagination, filters, and search.
   */
  async findAll(query: QueryInvoiceDto) {
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
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { customerNumber: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
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
          items: true,
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single invoice with full details.
   */
  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: { include: { package: true } },
        items: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  /**
   * Mark invoice as paid (partial or full).
   */
  async markPaid(id: string, dto: MarkInvoicePaidDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    const newAmountPaid = Number(invoice.amountPaid) + dto.amount;
    const newBalance = Number(invoice.total) - newAmountPaid;
    const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        balance: Math.max(0, newBalance),
        status: newStatus,
      },
    });

    this.logger.log(
      `Invoice ${invoice.invoiceNumber} marked ${newStatus} — KES ${dto.amount} received`,
    );

    return updated;
  }

  /**
   * Cancel an invoice.
   */
  async cancel(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Get invoice stats for dashboard.
   */
  async getStats() {
    const [pending, paid, overdue, cancelled] = await Promise.all([
      this.prisma.invoice.count({ where: { status: 'PENDING' } }),
      this.prisma.invoice.count({ where: { status: 'PAID' } }),
      this.prisma.invoice.count({
        where: { status: 'PENDING', dueDate: { lt: new Date() } },
      }),
      this.prisma.invoice.count({ where: { status: 'CANCELLED' } }),
    ]);

    const pendingAmount = await this.prisma.invoice.aggregate({
      where: { status: 'PENDING' },
      _sum: { balance: true },
    });

    return {
      pending,
      paid,
      overdue,
      cancelled,
      pendingAmount: Number(pendingAmount._sum.balance || 0),
    };
  }
}
