// ============================================
// Net-On API — Report Service
// ============================================
// Provides business intelligence aggregation queries
// for revenue, subscriber trends, collection
// efficiency, and network usage analytics.
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Revenue Report — Monthly breakdown, by package, by provider.
   */
  async getRevenueReport(months = 12) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Monthly revenue trend
    const monthlyRevenue = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const agg = await this.prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paidAt: { gte: mStart, lte: mEnd },
        },
        _sum: { amount: true },
        _count: true,
      });

      monthlyRevenue.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        revenue: Number(agg._sum.amount || 0),
        transactionCount: agg._count,
      });
    }

    // Revenue by provider
    const allSuccessPayments = await this.prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      select: { amount: true, provider: true },
    });

    const byProvider: Record<string, { revenue: number; count: number }> = {};
    for (const p of allSuccessPayments) {
      if (!byProvider[p.provider]) byProvider[p.provider] = { revenue: 0, count: 0 };
      byProvider[p.provider].revenue += Number(p.amount);
      byProvider[p.provider].count += 1;
    }

    // Revenue by package
    const invoicesWithPackage = await this.prisma.invoice.findMany({
      where: { status: 'PAID' },
      select: {
        total: true,
        subscription: {
          select: {
            package: { select: { name: true } },
          },
        },
      },
    });

    const byPackage: Record<string, { revenue: number; count: number }> = {};
    for (const inv of invoicesWithPackage) {
      const pkgName = inv.subscription?.package?.name || 'Other';
      if (!byPackage[pkgName]) byPackage[pkgName] = { revenue: 0, count: 0 };
      byPackage[pkgName].revenue += Number(inv.total);
      byPackage[pkgName].count += 1;
    }

    // Totals
    const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
    const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;
    const previousMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0;

    let growthPercentage = 0;
    if (previousMonthRevenue > 0) {
      growthPercentage = Number((((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1));
    } else if (currentMonthRevenue > 0) {
      growthPercentage = 100;
    }

    return {
      monthlyRevenue,
      byProvider: Object.entries(byProvider).map(([provider, data]) => ({
        provider,
        ...data,
      })),
      byPackage: Object.entries(byPackage).map(([packageName, data]) => ({
        packageName,
        ...data,
      })),
      summary: {
        totalRevenue,
        currentMonthRevenue,
        previousMonthRevenue,
        growthPercentage,
        averageMonthlyRevenue: Math.round(totalRevenue / months),
      },
    };
  }

  /**
   * Subscriber Report — Growth, churn, active/expired timeline.
   */
  async getSubscriberReport(months = 12) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const timeline = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const [total, active, expired, suspended] = await Promise.all([
        this.prisma.customer.count({
          where: { createdAt: { lte: mEnd } },
        }),
        this.prisma.subscription.count({
          where: { status: 'ACTIVE', createdAt: { lte: mEnd } },
        }),
        this.prisma.subscription.count({
          where: { status: 'EXPIRED', expiryDate: { lte: mEnd } },
        }),
        this.prisma.subscription.count({
          where: { status: 'SUSPENDED', updatedAt: { lte: mEnd } },
        }),
      ]);

      timeline.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        totalCustomers: total,
        activeSubscriptions: active,
        expiredSubscriptions: expired,
        suspendedSubscriptions: suspended,
      });
    }

    // Current stats
    const [totalCustomers, activeCustomers, totalSubscriptions, activeSubscriptions] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    // Package distribution
    const subscriptionsByPackage = await this.prisma.subscription.groupBy({
      by: ['packageId'],
      where: { status: 'ACTIVE' },
      _count: true,
    });

    const packages = await this.prisma.internetPackage.findMany({
      select: { id: true, name: true, price: true },
    });

    const packageMap = new Map(packages.map(p => [p.id, p]));

    const packageDistribution = subscriptionsByPackage.map(s => ({
      packageName: packageMap.get(s.packageId)?.name || 'Unknown',
      price: Number(packageMap.get(s.packageId)?.price || 0),
      activeCount: s._count,
    })).sort((a, b) => b.activeCount - a.activeCount);

    const churnRate = totalSubscriptions > 0
      ? Number(((totalSubscriptions - activeSubscriptions) / totalSubscriptions * 100).toFixed(1))
      : 0;

    return {
      timeline,
      packageDistribution,
      summary: {
        totalCustomers,
        activeCustomers,
        totalSubscriptions,
        activeSubscriptions,
        churnRate,
        retentionRate: Number((100 - churnRate).toFixed(1)),
      },
    };
  }

  /**
   * Collections Report — Efficiency, outstanding balances.
   */
  async getCollectionsReport() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Invoice vs payment collection rate per month (last 6 months)
    const collectionTimeline = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const [invoiced, collected] = await Promise.all([
        this.prisma.invoice.aggregate({
          where: { issueDate: { gte: mStart, lte: mEnd } },
          _sum: { total: true },
          _count: true,
        }),
        this.prisma.payment.aggregate({
          where: { status: 'SUCCESS', paidAt: { gte: mStart, lte: mEnd } },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      const invoicedAmount = Number(invoiced._sum.total || 0);
      const collectedAmount = Number(collected._sum.amount || 0);

      collectionTimeline.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        invoicedAmount,
        collectedAmount,
        collectionRate: invoicedAmount > 0 ? Number(((collectedAmount / invoicedAmount) * 100).toFixed(1)) : 0,
        invoiceCount: invoiced._count,
        paymentCount: collected._count,
      });
    }

    // Outstanding balances
    const outstandingInvoices = await this.prisma.invoice.findMany({
      where: { status: { in: ['PENDING', 'OVERDUE'] } },
      select: { balance: true, status: true, dueDate: true },
    });

    const totalOutstanding = outstandingInvoices.reduce((s, inv) => s + Number(inv.balance), 0);
    const overdueInvoices = outstandingInvoices.filter(inv => inv.status === 'OVERDUE');
    const overdueAmount = overdueInvoices.reduce((s, inv) => s + Number(inv.balance), 0);

    // Overall collection efficiency
    const [totalInvoiced, totalCollected] = await Promise.all([
      this.prisma.invoice.aggregate({ _sum: { total: true } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
    ]);

    const overallEfficiency = Number(totalInvoiced._sum.total || 0) > 0
      ? Number(((Number(totalCollected._sum.amount || 0) / Number(totalInvoiced._sum.total || 1)) * 100).toFixed(1))
      : 0;

    return {
      collectionTimeline,
      summary: {
        totalOutstanding,
        overdueAmount,
        overdueCount: overdueInvoices.length,
        pendingCount: outstandingInvoices.length - overdueInvoices.length,
        overallCollectionEfficiency: overallEfficiency,
        totalInvoiced: Number(totalInvoiced._sum.total || 0),
        totalCollected: Number(totalCollected._sum.amount || 0),
      },
    };
  }

  /**
   * Network Report — Router load, sessions, bandwidth.
   */
  async getNetworkReport() {
    const routers = await this.prisma.router.findMany({
      include: {
        _count: { select: { networkAccounts: true, syncJobs: true } },
      },
    });

    const networkAccounts = await this.prisma.networkAccount.groupBy({
      by: ['status'],
      _count: true,
    });

    const syncJobs = await this.prisma.networkSyncJob.groupBy({
      by: ['status'],
      _count: true,
    });

    const totalSessions = await this.prisma.networkSession.count();
    const activeSessions = await this.prisma.networkAccount.count({
      where: { status: 'ACTIVE' },
    });

    return {
      routers: routers.map(r => ({
        id: r.id,
        name: r.name,
        ip: r.managementIp,
        status: r.status,
        location: r.location,
        accountCount: r._count.networkAccounts,
        pendingSyncJobs: r._count.syncJobs,
        lastHealthCheck: r.lastHealthCheck,
        capabilities: r.capabilities,
      })),
      accountsByStatus: networkAccounts.map(g => ({
        status: g.status,
        count: g._count,
      })),
      syncJobsByStatus: syncJobs.map(g => ({
        status: g.status,
        count: g._count,
      })),
      summary: {
        totalRouters: routers.length,
        onlineRouters: routers.filter(r => r.status === 'ONLINE').length,
        totalNetworkAccounts: networkAccounts.reduce((s, g) => s + g._count, 0),
        activeAccounts: activeSessions,
        totalSessions,
      },
    };
  }
}
