// ============================================
// Net-On API — Dashboard Service
// ============================================
// Aggregates real-time business intelligence metrics,
// subscription counts, revenue charts, and audit activity.
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // 1. Customer metrics
    const [totalCustomers, activeCustomers, suspendedCustomers] = await Promise.all([
      this.prisma.customer.count({ where: { status: { not: 'ARCHIVED' } } }),
      this.prisma.customer.count({ where: { status: 'ACTIVE' } }),
      this.prisma.customer.count({ where: { status: 'SUSPENDED' } }),
    ]);

    // 2. Subscriptions metrics
    const [activeSubscriptions, totalSubscriptions, expiringSubscriptions] = await Promise.all([
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count(),
      this.prisma.subscription.count({
        where: {
          OR: [
            { status: 'EXPIRING' },
            {
              status: 'ACTIVE',
              expiryDate: {
                lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                gte: now,
              },
            },
          ],
        },
      }),
    ]);

    // 3. Revenue metrics
    const [currentMonthPayments, lastMonthPayments, allTimeRevenueAgg] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paidAt: {
            gte: startOfCurrentMonth,
            lte: endOfCurrentMonth,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paidAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
    ]);

    const currentMonthRevenue = Number(currentMonthPayments._sum.amount || 0);
    const lastMonthRevenue = Number(lastMonthPayments._sum.amount || 0);
    const allTimeRevenue = Number(allTimeRevenueAgg._sum.amount || 0);

    let revenueGrowth = 0;
    if (lastMonthRevenue > 0) {
      revenueGrowth = Number((((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));
    } else if (currentMonthRevenue > 0) {
      revenueGrowth = 100;
    }

    // 4. Pending / Overdue Invoices
    const pendingInvoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      select: {
        balance: true,
        status: true,
      },
    });

    const pendingInvoicesCount = pendingInvoices.length;
    const pendingInvoicesAmount = pendingInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0);

    // 5. 6-Month Revenue Trend
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueTrend = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const mAgg = await this.prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paidAt: {
            gte: mStart,
            lte: mEnd,
          },
        },
        _sum: { amount: true },
      });

      const amt = Number(mAgg._sum.amount || 0);
      revenueTrend.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        rawAmount: amt,
        amount: amt >= 1000 ? `${(amt / 1000).toFixed(0)}k` : `${amt}`,
        current: i === 0,
      });
    }

    // 6. Router Summary
    const routers = await this.prisma.router.findMany({
      select: {
        id: true,
        name: true,
        managementIp: true,
        status: true,
        capabilities: true,
        _count: {
          select: {
            networkAccounts: true,
          },
        },
      },
    });

    // 7. Recent Audit Logs
    const recentActivity = await this.prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    // 8. Recent Payments
    const recentPayments = await this.prisma.payment.findMany({
      take: 5,
      where: { status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            customerNumber: true,
          },
        },
      },
    });

    return {
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        suspended: suspendedCustomers,
        expiredOrGrace: totalCustomers - activeCustomers,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        expiring: expiringSubscriptions,
        activeRate: totalSubscriptions > 0 ? Math.round((activeSubscriptions / totalSubscriptions) * 100) : 0,
      },
      revenue: {
        currentMonth: currentMonthRevenue,
        lastMonth: lastMonthRevenue,
        allTime: allTimeRevenue,
        growthPercentage: revenueGrowth,
        trend: revenueTrend,
      },
      invoices: {
        pendingCount: pendingInvoicesCount,
        pendingAmount: pendingInvoicesAmount,
      },
      routers: routers.map((r) => ({
        id: r.id,
        name: r.name,
        ip: r.managementIp,
        status: r.status,
        activeAccounts: r._count.networkAccounts,
        capabilities: r.capabilities,
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        resource: a.resource,
        result: a.result,
        userEmail: a.user?.email || 'System',
        createdAt: a.createdAt,
      })),
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        customerName: p.customer ? `${p.customer.firstName} ${p.customer.lastName}` : 'Anonymous',
        customerNumber: p.customer?.customerNumber || 'N/A',
        amount: Number(p.amount),
        provider: p.provider,
        reference: p.transactionReference,
        paidAt: p.paidAt || p.createdAt,
      })),
    };
  }
}
