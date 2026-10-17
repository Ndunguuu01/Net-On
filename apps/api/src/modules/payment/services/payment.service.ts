// ============================================
// Net-On API — Payment Service
// ============================================
// Handles payment processing, M-Pesa STK push,
// manual recording, and invoice reconciliation.
// ============================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';
import { PrismaService } from '../../../database/prisma.service';
import { MpesaService } from './mpesa.service';
import {
  StkPushDto,
  ManualPaymentDto,
  QueryPaymentDto,
} from '../dto/payment.dto';
import { v4 as uuid } from 'uuid';

// Safaricom Daraja callback IP subnets
const SAFARICOM_SUBNETS = [
  { network: '196.201.214.0', mask: 24 },
  { network: '196.201.213.0', mask: 24 },
];

function isIpInSubnet(ip: string, network: string, mask: number): boolean {
  // Normalize IPv4-mapped IPv6 addresses (e.g., ::ffff:196.201.214.10)
  const cleanIp = ip.replace(/^::ffff:/, '');
  if (!net.isIPv4(cleanIp) || !net.isIPv4(network)) return false;
  const ipNum = cleanIp.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
  const netNum = network.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
  const maskBits = (~0 << (32 - mask)) >>> 0;
  return (ipNum & maskBits) === (netNum & maskBits);
}

function isSafaricomIp(ip: string): boolean {
  return SAFARICOM_SUBNETS.some(s => isIpInSubnet(ip, s.network, s.mask));
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mpesaService: MpesaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Initiate M-Pesa STK Push payment.
   */
  async initiateSTKPush(dto: StkPushDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      select: { id: true, customerNumber: true, firstName: true, lastName: true },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    const transactionRef = `STK-${uuid().substring(0, 12).toUpperCase()}`;

    // Initiate STK Push
    const result = await this.mpesaService.initiateSTKPush(
      dto.phoneNumber,
      dto.amount,
      customer.customerNumber,
      dto.description || `Internet payment for ${customer.customerNumber}`,
    );

    // Create pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        customerId: dto.customerId,
        invoiceId: dto.invoiceId || null,
        amount: dto.amount,
        provider: 'MPESA_STK',
        transactionReference: transactionRef,
        providerTransactionId: result.checkoutRequestId,
        phoneNumber: dto.phoneNumber,
        status: result.success ? 'PENDING' : 'FAILED',
        providerMetadata: {
          merchantRequestId: result.merchantRequestId,
          checkoutRequestId: result.checkoutRequestId,
          responseDescription: result.responseDescription,
        },
      },
      include: {
        customer: {
          select: { customerNumber: true, firstName: true, lastName: true },
        },
      },
    });

    this.logger.log(
      `STK Push initiated for ${customer.customerNumber}: KES ${dto.amount} → ${dto.phoneNumber}`,
    );

    return { payment, stkResult: result };
  }

  /**
   * Record a manual payment (cash, bank transfer, etc.)
   */
  async recordManual(dto: ManualPaymentDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    // Check for duplicate reference
    const existing = await this.prisma.payment.findUnique({
      where: { transactionReference: dto.transactionReference },
    });
    if (existing) {
      throw new ConflictException(
        `Payment with reference ${dto.transactionReference} already exists`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        customerId: dto.customerId,
        invoiceId: dto.invoiceId || null,
        amount: dto.amount,
        provider: dto.provider,
        transactionReference: dto.transactionReference,
        phoneNumber: dto.phoneNumber,
        status: 'COMPLETED',
        reconciliationStatus: dto.invoiceId ? 'RECONCILED' : 'PENDING',
        paidAt: new Date(),
      },
      include: {
        customer: {
          select: { customerNumber: true, firstName: true, lastName: true },
        },
      },
    });

    // Auto-reconcile with invoice if provided
    if (dto.invoiceId) {
      await this.reconcilePayment(payment.id, dto.invoiceId);
    }

    this.logger.log(
      `Manual payment recorded: KES ${dto.amount} via ${dto.provider} — Ref: ${dto.transactionReference}`,
    );

    return payment;
  }

  /**
   * Handle M-Pesa callback (STK Push result).
   * Validates structure, verifies webhook token and source IP, and reconciles idempotently.
   */
  async handleMpesaCallback(callbackData: any, token?: string, clientIp?: string) {
    // Validate webhook token if configured — reject if missing OR mismatched
    const configuredToken = this.config.get<string>('MPESA_WEBHOOK_SECRET');
    if (configuredToken && (!token || token !== configuredToken)) {
      this.logger.warn('M-Pesa callback rejected: missing or invalid webhook secret token');
      throw new ForbiddenException('Invalid webhook credentials');
    }

    // Validate Safaricom source IP in production mode (defense-in-depth alongside Nginx)
    const nodeEnv = this.config.get<string>('NODE_ENV');
    if (nodeEnv === 'production' && clientIp && !isSafaricomIp(clientIp)) {
      this.logger.warn(`M-Pesa callback rejected: untrusted source IP ${clientIp}`);
      throw new ForbiddenException('Untrusted source IP');
    }

    if (!callbackData?.Body?.stkCallback) {
      this.logger.warn('M-Pesa callback rejected: invalid payload structure');
      return;
    }

    const { stkCallback } = callbackData.Body;
    const { CheckoutRequestID, ResultCode, CallbackMetadata } = stkCallback;

    if (!CheckoutRequestID) {
      this.logger.warn('M-Pesa callback rejected: missing CheckoutRequestID');
      return;
    }

    const payment = await this.prisma.payment.findFirst({
      where: { providerTransactionId: CheckoutRequestID },
    });

    if (!payment) {
      this.logger.warn(`M-Pesa callback for unknown checkout: ${CheckoutRequestID}`);
      return;
    }

    // Idempotency: skip if already processed successfully
    if (payment.status === 'COMPLETED') {
      this.logger.log(`M-Pesa callback already processed for checkout: ${CheckoutRequestID}`);
      return;
    }

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      // Payment successful
      const metadata: Record<string, any> = {};
      CallbackMetadata.Item.forEach((item: any) => {
        if (item?.Name) {
          metadata[item.Name] = item.Value;
        }
      });

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
          providerTransactionId: metadata.MpesaReceiptNumber || CheckoutRequestID,
          providerMetadata: {
            ...(payment.providerMetadata as any),
            ...metadata,
          },
        },
      });

      // Auto-reconcile if invoice is linked
      if (payment.invoiceId) {
        await this.reconcilePayment(payment.id, payment.invoiceId);
      }

      this.logger.log(
        `M-Pesa payment confirmed: KES ${payment.amount} — Receipt: ${metadata.MpesaReceiptNumber || CheckoutRequestID}`,
      );
    } else {
      // Payment failed
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          providerMetadata: {
            ...(payment.providerMetadata as any),
            resultCode: ResultCode,
            resultDesc: stkCallback.ResultDesc,
          },
        },
      });

      this.logger.warn(
        `M-Pesa payment failed: ${stkCallback.ResultDesc} (Code: ${ResultCode})`,
      );
    }
  }

  /**
   * Reconcile a payment against an invoice.
   */
  private async reconcilePayment(paymentId: string, invoiceId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });

    if (!payment || !invoice) return;

    const newAmountPaid = Number(invoice.amountPaid) + Number(payment.amount);
    const newBalance = Number(invoice.total) - newAmountPaid;

    await this.prisma.$transaction([
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          balance: Math.max(0, newBalance),
          status: newBalance <= 0 ? 'PAID' : 'PARTIAL',
        },
      }),
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { reconciliationStatus: 'RECONCILED' },
      }),
    ]);
  }

  /**
   * List payments with pagination, filters, and search.
   */
  async findAll(query: QueryPaymentDto) {
    const {
      page = 1,
      limit = 20,
      status,
      provider,
      customerId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (provider) where.provider = provider;
    if (customerId) where.customerId = customerId;

    if (search) {
      where.OR = [
        { transactionReference: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { providerTransactionId: { contains: search, mode: 'insensitive' } },
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
      this.prisma.payment.findMany({
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
          invoice: {
            select: { id: true, invoiceNumber: true, total: true, status: true },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get payment stats for dashboard.
   */
  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCompleted, totalPending, monthlyRevenue] = await Promise.all([
      this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalCompleted,
      totalPending,
      monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
      monthlyCount: monthlyRevenue._count,
    };
  }
}
