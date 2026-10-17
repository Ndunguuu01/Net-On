'use client';

// ============================================
// Net-On — Admin Subscriptions Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Repeat,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Pause,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface SubscriptionItem {
  id: string;
  status: string;
  startDate: string;
  expiryDate: string;
  autoRenew: boolean;
  gracePeriodDays: number;
  customer: {
    id: string;
    customerNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  package: {
    id: string;
    name: string;
    price: number;
    downloadSpeed: number;
    uploadSpeed: number;
    speedUnit: string;
    durationDays: number;
  };
}

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  ACTIVE: { icon: CheckCircle2, label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  GRACE_PERIOD: { icon: Clock, label: 'Grace Period', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  GRACE: { icon: Clock, label: 'Grace Period', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  EXPIRING: { icon: Clock, label: 'Expiring Soon', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  EXPIRED: { icon: XCircle, label: 'Expired', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  SUSPENDED: { icon: Pause, label: 'Suspended', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [stats, setStats] = useState<{ active: number; grace: number; expired: number; suspended: number }>({
    active: 0, grace: 0, expired: 0, suspended: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const [res, statsRes]: any = await Promise.allSettled([
        api.get('/subscriptions', params),
        api.get('/subscriptions/stats'),
      ]);

      if (res.status === 'fulfilled') {
        const val = res.value;
        const items = val?.items || val?.data?.items || (Array.isArray(val) ? val : []);
        const pages = val?.meta?.totalPages || val?.data?.meta?.totalPages || 1;
        const total = val?.meta?.total ?? val?.data?.meta?.total ?? items.length;

        setSubscriptions(items);
        setTotalPages(pages);
        setTotalCount(total);
      } else {
        throw res.reason;
      }

      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value?.data || statsRes.value || {};
        setStats({
          active: s.active || 0,
          grace: s.grace || s.gracePeriod || 0,
          expired: s.expired || 0,
          suspended: s.suspended || 0,
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch subscriptions:', err);
      setError(err.message || 'Failed to load subscriptions.');
      setSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const daysUntilExpiry = (date: string) => {
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Repeat className="w-6 h-6 text-cyan-400" />
            Subscriptions
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage subscriber packages, renewal cycles, and grace periods.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchSubscriptions()}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchSubscriptions()} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active', count: stats.active || subscriptions.filter(s => s.status === 'ACTIVE').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Grace Period', count: stats.grace || subscriptions.filter(s => s.status === 'GRACE' || s.status === 'GRACE_PERIOD').length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Expired', count: stats.expired || subscriptions.filter(s => s.status === 'EXPIRED').length, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
          { label: 'Suspended', count: stats.suspended || subscriptions.filter(s => s.status === 'SUSPENDED').length, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`glass-card p-4 text-center border ${stat.bg}`}>
            <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.count}</div>
            <div className="text-[11px] text-muted-foreground font-semibold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by customer name, number, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSubscriptions()}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRING">Expiring Soon</option>
          <option value="GRACE_PERIOD">Grace Period</option>
          <option value="EXPIRED">Expired</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          <span>Loading subscriptions...</span>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Repeat className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="font-bold text-foreground">No subscriptions found</p>
          <p className="text-xs text-muted-foreground">
            No subscriptions matching the current filters were found in the database.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-background/40">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Package</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Speed</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Period</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Expiry</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Auto-Renew</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {subscriptions.map((sub) => {
                  const cfg = statusConfig[sub.status] || statusConfig.ACTIVE;
                  const StatusIcon = cfg.icon;
                  const days = daysUntilExpiry(sub.expiryDate);
                  return (
                    <tr key={sub.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/customers/${sub.customer.id}`} className="hover:text-primary transition-colors">
                          <div className="font-semibold text-foreground">{sub.customer.firstName} {sub.customer.lastName}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{sub.customer.customerNumber}</div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{sub.package.name}</div>
                        <div className="text-[10px] text-muted-foreground">KSh {Number(sub.package.price).toLocaleString()}/mo</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded text-[10px] font-bold">
                          {sub.package.downloadSpeed}/{sub.package.uploadSpeed} {sub.package.speedUnit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{new Date(sub.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                        <div className="text-[10px]">→ {new Date(sub.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold ${days <= 0 ? 'text-rose-400' : days <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {days <= 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {sub.autoRenew ? (
                          <span className="text-emerald-400 text-[10px] font-semibold">ON</span>
                        ) : (
                          <span className="text-muted-foreground text-[10px] font-semibold">OFF</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/customers/${sub.customer.id}`}
                            className="px-2.5 py-1 rounded bg-card/60 border border-border/40 hover:bg-accent hover:text-primary transition-all text-[11px] font-semibold"
                          >
                            Manage
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-background/40">
            <span className="text-[11px] text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{subscriptions.length}</span> of{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> subscriptions
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1 || isLoading}
                className="p-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages || isLoading}
                className="p-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
