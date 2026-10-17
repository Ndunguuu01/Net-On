'use client';

// ============================================
// Net-On — Admin Dashboard Home Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Repeat,
  DollarSign,
  FileText,
  TrendingUp,
  Router,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface DashboardStats {
  customers: {
    total: number;
    active: number;
    suspended: number;
    expiredOrGrace: number;
  };
  subscriptions: {
    total: number;
    active: number;
    expiring: number;
    activeRate: number;
  };
  revenue: {
    currentMonth: number;
    lastMonth: number;
    allTime: number;
    growthPercentage: number;
    trend: Array<{
      month: string;
      year: number;
      rawAmount: number;
      amount: string;
      current: boolean;
    }>;
  };
  invoices: {
    pendingCount: number;
    pendingAmount: number;
  };
  routers: Array<{
    id: string;
    name: string;
    ip: string;
    status: string;
    activeAccounts: number;
    capabilities?: any;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    result: string;
    userEmail: string;
    createdAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    customerName: string;
    customerNumber: string;
    amount: number;
    provider: string;
    reference: string;
    paidAt: string;
  }>;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<DashboardStats>('/dashboard/stats');
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load dashboard stats:', err);
      setError(err.message || 'Unable to connect to the API server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Max amount in revenue trend for relative bar heights
  const maxTrendAmount = Math.max(
    ...(stats?.revenue.trend.map((t) => t.rawAmount) || [1]),
    1
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-primary" />
            System Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time subscriber metrics, revenue breakdown, and MikroTik network status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(true)}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/60 border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <Link
            href="/admin/customers/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchStats()}
            className="underline hover:text-rose-300 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Customers */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-primary/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Customers
            </span>
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {isLoading ? (
                <div className="h-8 w-16 bg-muted/30 rounded animate-pulse" />
              ) : (
                stats?.customers.total ?? 0
              )}
            </div>
            {!isLoading && (
              <div className="flex items-center text-xs font-bold text-emerald-400 gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{stats?.customers.active ?? 0} Live</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {isLoading ? (
              <div className="h-3 w-28 bg-muted/20 rounded animate-pulse" />
            ) : (
              `${stats?.customers.active ?? 0} Active • ${stats?.customers.suspended ?? 0} Suspended`
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary" />
        </div>

        {/* Metric 2: Active Subscriptions */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Subscriptions
            </span>
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {isLoading ? (
                <div className="h-8 w-16 bg-muted/30 rounded animate-pulse" />
              ) : (
                stats?.subscriptions.active ?? 0
              )}
            </div>
            {!isLoading && (
              <div className="flex items-center text-xs font-bold text-cyan-400 gap-0.5">
                <span>{stats?.subscriptions.activeRate ?? 0}% Rate</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {isLoading ? (
              <div className="h-3 w-28 bg-muted/20 rounded animate-pulse" />
            ) : (
              `${stats?.subscriptions.expiring ?? 0} expiring within 7 days`
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/50 to-cyan-400" />
        </div>

        {/* Metric 3: Monthly Revenue (KES) */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Monthly Revenue
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted/30 rounded animate-pulse" />
              ) : (
                `KSh ${(stats?.revenue.currentMonth ?? 0).toLocaleString()}`
              )}
            </div>
            {!isLoading && stats && (
              <div className={`flex items-center text-xs font-bold gap-0.5 ${stats.revenue.growthPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.revenue.growthPercentage >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                <span>{stats.revenue.growthPercentage > 0 ? `+${stats.revenue.growthPercentage}%` : `${stats.revenue.growthPercentage}%`}</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {isLoading ? (
              <div className="h-3 w-32 bg-muted/20 rounded animate-pulse" />
            ) : (
              `All time: KSh ${(stats?.revenue.allTime ?? 0).toLocaleString()}`
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/50 to-emerald-400" />
        </div>

        {/* Metric 4: Pending Invoices */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Invoices
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {isLoading ? (
                <div className="h-8 w-12 bg-muted/30 rounded animate-pulse" />
              ) : (
                stats?.invoices.pendingCount ?? 0
              )}
            </div>
            {!isLoading && (
              <div className="flex items-center text-xs font-bold text-amber-400 gap-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>KSh {(stats?.invoices.pendingAmount ?? 0).toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {isLoading ? (
              <div className="h-3 w-28 bg-muted/20 rounded animate-pulse" />
            ) : (
              'Unpaid & Overdue balances'
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/50 to-amber-400" />
        </div>
      </div>

      {/* Main Grid: Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Revenue & Subscriptions Breakdown (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Growth Trend Card */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Revenue & Collection Trend</h3>
                <p className="text-xs text-muted-foreground">6-month monthly billing performance (KES)</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
                {new Date().getFullYear()} Active Trend
              </span>
            </div>

            {/* Visual Bar Chart Representation */}
            <div className="pt-6 pb-2 grid grid-cols-6 gap-3 items-end h-48 border-b border-border/40">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-full bg-muted/20 rounded-t-lg animate-pulse" style={{ height: `${(i + 1) * 20}%` }} />
                    <div className="h-3 w-6 bg-muted/30 rounded" />
                  </div>
                ))
              ) : (
                stats?.revenue.trend.map((item) => {
                  const heightPercent = maxTrendAmount > 0
                    ? Math.max(12, Math.round((item.rawAmount / maxTrendAmount) * 100))
                    : 12;

                  return (
                    <div key={item.month} className="flex flex-col items-center gap-2 group">
                      <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                        {item.rawAmount > 0 ? item.amount : '0'}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          item.current
                            ? 'bg-gradient-to-t from-primary/80 to-cyan-400 shadow-lg shadow-primary/20'
                            : item.rawAmount > 0
                            ? 'bg-primary/40 hover:bg-primary/60'
                            : 'bg-muted/30'
                        }`}
                      />
                      <span className="text-[11px] font-semibold text-foreground">{item.month}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-primary" />
                  <span>Collected via M-Pesa & Cash</span>
                </div>
              </div>
              <span className="font-semibold text-emerald-400">
                {stats?.customers.active ?? 0} Active Paying Subscribers
              </span>
            </div>
          </div>

          {/* Quick Action Shortcuts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              href="/admin/customers/new"
              className="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">Add Customer</span>
            </Link>

            <Link
              href="/admin/payments"
              className="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-200 text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">Payments</span>
            </Link>

            <Link
              href="/admin/routers"
              className="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-200 text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Router className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">Routers</span>
            </Link>

            <Link
              href="/admin/packages"
              className="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-200 text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">Packages</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Router Status & Recent Activity Stream */}
        <div className="space-y-6">
          {/* MikroTik Network Gateways Card */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Router className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Network Gateways
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                {stats?.routers.filter((r) => r.status === 'ONLINE').length ?? 1} / {stats?.routers.length || 1} Online
              </span>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="p-3 rounded-lg bg-background/50 border border-border/40 space-y-2 animate-pulse">
                  <div className="h-4 w-32 bg-muted/30 rounded" />
                  <div className="h-3 w-48 bg-muted/20 rounded" />
                </div>
              ) : stats?.routers && stats.routers.length > 0 ? (
                stats.routers.map((router) => (
                  <div key={router.id} className="p-3 rounded-lg bg-background/50 border border-border/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{router.name}</span>
                      <span className={`flex items-center gap-1 text-[10px] font-semibold ${router.status === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <CheckCircle2 className="w-3 h-3" /> {router.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {router.ip} • RouterOS API ({router.capabilities?.routerOs || 'v7.14'})
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 pt-1">
                      <span>Active PPP/Hotspot: {router.activeAccounts}</span>
                      <span>Model: {router.capabilities?.model || 'CCR2004'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No routers configured
                </div>
              )}
            </div>
          </div>

          {/* Recent Payments Stream */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Recent Payments
              </h3>
              <Link href="/admin/payments" className="text-[11px] text-primary hover:underline flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3 divide-y divide-border/20">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="pt-2 space-y-1 animate-pulse">
                    <div className="h-3.5 w-28 bg-muted/30 rounded" />
                    <div className="h-3 w-40 bg-muted/20 rounded" />
                  </div>
                ))
              ) : stats?.recentPayments && stats.recentPayments.length > 0 ? (
                stats.recentPayments.map((payment) => (
                  <div key={payment.id} className="pt-2.5 first:pt-0 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{payment.customerName}</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        KSh {payment.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-mono text-[10px]">{payment.reference} ({payment.provider})</span>
                      <span>{timeAgo(payment.paidAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground text-center py-3">
                  No payments recorded yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
