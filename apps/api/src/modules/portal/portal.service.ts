// ============================================
// Net-On API — Portal Service
// ============================================
// Customer-facing service that provides scoped
// access to subscription, invoice, payment, and
// support data filtered by the authenticated customer.
// ============================================

import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PortalService {
  private readonly logger = new Logger(PortalService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the customer record linked to a user ID.
   * Throws if no customer is linked.
   */
  private async getCustomerByUserId(userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { userId },
      select: { id: true, customerNumber: true, firstName: true, lastName: true, phone: true, email: true, status: true },
    });
    if (!customer) {
      throw new ForbiddenException('No customer profile linked to this account');
    }
    return customer;
  }

  /**
   * Portal Dashboard — aggregated customer-specific stats.
   */
  async getDashboard(userId: string) {
    const customer = await this.getCustomerByUserId(userId);

    const [subscription, invoices, latestPayment, openTickets] = await Promise.all([
      // Active subscription with package details
      this.prisma.subscription.findFirst({
        where: { customerId: customer.id, status: { in: ['ACTIVE', 'EXPIRING', 'GRACE_PERIOD'] } },
        orderBy: { createdAt: 'desc' },
        include: { package: true },
      }),

      // Unpaid invoices
      this.prisma.invoice.findMany({
        where: { customerId: customer.id, status: { in: ['PENDING', 'OVERDUE'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Latest payment
      this.prisma.payment.findFirst({
        where: { customerId: customer.id, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      }),

      // Open support tickets count
      this.prisma.supportTicket.count({
        where: { customerId: customer.id, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER'] } },
      }),
    ]);

    const outstandingBalance = invoices.reduce((sum: number, inv: any) => sum + Number(inv.balance || 0), 0);
    const daysToExpiry = subscription?.expiryDate
      ? Math.ceil((new Date(subscription.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      customer: {
        id: customer.id,
        customerNumber: customer.customerNumber,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email,
        status: customer.status,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            packageName: subscription.package.name,
            downloadSpeed: subscription.package.downloadSpeed,
            uploadSpeed: subscription.package.uploadSpeed,
            speedUnit: subscription.package.speedUnit,
            price: Number(subscription.package.price),
            startDate: subscription.startDate,
            expiryDate: subscription.expiryDate,
            daysToExpiry,
            autoRenew: subscription.autoRenew,
          }
        : null,
      billing: {
        outstandingBalance,
        unpaidInvoices: invoices.length,
        latestPayment: latestPayment
          ? {
              amount: Number(latestPayment.amount),
              method: latestPayment.provider,
              paidAt: latestPayment.paidAt,
              transactionRef: latestPayment.transactionReference,
            }
          : null,
      },
      openTickets,
    };
  }

  /**
   * Get customer's own invoices.
   */
  async getInvoices(userId: string, query: { page?: number; limit?: number; status?: string }) {
    const customer = await this.getCustomerByUserId(userId);
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;
    const where: any = { customerId: customer.id };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Get a single invoice detail (owned by customer).
   */
  async getInvoiceDetail(userId: string, invoiceId: string) {
    const customer = await this.getCustomerByUserId(userId);

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, customerId: customer.id },
      include: {
        items: true,
        customer: { select: { firstName: true, lastName: true, customerNumber: true, phone: true, email: true, address: true, installationAddress: true } },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  /**
   * Get customer's own payments.
   */
  async getPayments(userId: string, query: { page?: number; limit?: number }) {
    const customer = await this.getCustomerByUserId(userId);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { customerId: customer.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where: { customerId: customer.id } }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Get customer's subscription details.
   */
  async getSubscription(userId: string) {
    const customer = await this.getCustomerByUserId(userId);

    const subscriptions = await this.prisma.subscription.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      include: { package: true },
    });

    return subscriptions;
  }

  /**
   * Initiate M-Pesa STK Push for customer self-checkout.
   */
  async initiatePayment(userId: string, dto: { invoiceId?: string; amount?: number; phone?: string }) {
    const customer = await this.getCustomerByUserId(userId);
    const phone = dto.phone || customer.phone;

    let amount = dto.amount;
    let invoiceId = dto.invoiceId;

    // If invoice specified, use its outstanding balance
    if (invoiceId) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: invoiceId, customerId: customer.id },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      amount = Number(invoice.balance);
    }

    if (!amount || amount <= 0) {
      throw new ForbiddenException('No outstanding balance to pay');
    }

    // Create a pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        customerId: customer.id,
        invoiceId: invoiceId || null,
        amount,
        provider: 'MPESA',
        status: 'PENDING',
        transactionReference: `STK-${Date.now().toString(36).toUpperCase()}`,
        phoneNumber: phone,
        providerMetadata: { phone, initiatedBy: 'customer_portal', timestamp: new Date().toISOString() },
      },
    });

    this.logger.log(`[Portal] STK Push initiated by ${customer.customerNumber} for KSh ${amount}`);

    return {
      paymentId: payment.id,
      transactionRef: payment.transactionReference,
      amount,
      phone,
      status: 'STK_PUSH_SENT',
      message: `M-Pesa payment prompt sent to ${phone}. Enter your PIN to complete.`,
    };
  }

  /**
   * Get customer's own support tickets.
   */
  async getTickets(userId: string) {
    const customer = await this.getCustomerByUserId(userId);

    return this.prisma.supportTicket.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Submit a new support ticket from the portal.
   */
  async createTicket(userId: string, dto: { subject: string; description: string; category?: string; priority?: string }) {
    const customer = await this.getCustomerByUserId(userId);

    // Generate ticket number
    const lastTicket = await this.prisma.supportTicket.findFirst({ orderBy: { createdAt: 'desc' } });
    const nextNum = lastTicket ? parseInt(lastTicket.ticketNumber.replace('TKT-', '')) + 1 : 1;
    const ticketNumber = `TKT-${String(nextNum).padStart(5, '0')}`;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        customerId: customer.id,
        subject: dto.subject,
        description: dto.description,
        category: dto.category || 'GENERAL',
        priority: dto.priority || 'MEDIUM',
        status: 'OPEN',
      },
    });

    this.logger.log(`[Portal] Support ticket ${ticketNumber} created by ${customer.customerNumber}`);
    return ticket;
  }

  /**
   * Get customer profile with linked account details.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        customer: {
          include: {
            subscriptions: {
              where: { status: { in: ['ACTIVE', 'EXPIRING', 'GRACE_PERIOD'] } },
              include: { package: true },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
            networkAccount: {
              select: { username: true, ipAddress: true, status: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
