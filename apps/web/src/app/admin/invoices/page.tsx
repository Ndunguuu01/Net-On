'use client';

// ============================================
// Net-On — Admin Invoices Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Download,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  total: number;
  amountPaid: number;
  balance: number;
  status: string;
  issueDate: string;
  dueDate: string;
  customer: {
    id: string;
    customerNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
}

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  PENDING: { icon: Clock, label: 'Pending', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  PAID: { icon: CheckCircle2, label: 'Paid', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  PARTIAL: { icon: AlertTriangle, label: 'Partial', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  OVERDUE: { icon: AlertTriangle, label: 'Overdue', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  CANCELLED: { icon: XCircle, label: 'Cancelled', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [stats, setStats] = useState<{ paidCount: number; paidAmount: number; pendingCount: number; pendingAmount: number; totalOutstanding: number }>({
    paidCount: 0, paidAmount: 0, pendingCount: 0, pendingAmount: 0, totalOutstanding: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const [res, statsRes]: any = await Promise.allSettled([
        api.get('/invoices', params),
        api.get('/invoices/stats'),
      ]);

      if (res.status === 'fulfilled') {
        const val = res.value;
        const items = val?.items || val?.data?.items || (Array.isArray(val) ? val : []);
        const pages = val?.meta?.totalPages || val?.data?.meta?.totalPages || 1;
        const total = val?.meta?.total ?? val?.data?.meta?.total ?? items.length;

        setInvoices(items);
        setTotalPages(pages);
        setTotalCount(total);
      } else {
        throw res.reason;
      }

      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value?.data || statsRes.value || {};
        setStats({
          paidCount: s.paidCount || 0,
          paidAmount: s.paidAmount || 0,
          pendingCount: s.pendingCount || 0,
          pendingAmount: s.pendingAmount || 0,
          totalOutstanding: s.totalOutstanding || s.pendingAmount || 0,
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch invoices:', err);
      setError(err.message || 'Failed to load invoices from API.');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleGenerateBulk = async () => {
    try {
      await api.post('/invoices/generate-bulk');
      await fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Bulk generation completed or no subscriptions due.');
    }
  };

  const calculatedPaidAmount = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + Number(i.amountPaid || i.total), 0);

  const calculatedPendingAmount = invoices
    .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + Number(i.balance || i.total), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            Invoices
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track billing, outstanding balances, and payment reconciliation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateBulk}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate Bulk</span>
          </button>
          <button
            onClick={() => fetchInvoices()}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
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
          <button onClick={() => fetchInvoices()} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Paid',
            count: stats.paidCount || invoices.filter((i) => i.status === 'PAID').length,
            amount: `KSh ${(stats.paidAmount || calculatedPaidAmount).toLocaleString()}`,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
          {
            label: 'Pending',
            count: stats.pendingCount || invoices.filter((i) => i.status === 'PENDING').length,
            amount: `KSh ${(stats.pendingAmount || calculatedPendingAmount).toLocaleString()}`,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
          },
          {
            label: 'Overdue',
            count: invoices.filter((i) => i.status === 'OVERDUE').length,
            amount: `KSh ${invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + Number(i.balance), 0).toLocaleString()}`,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10 border-rose-500/20',
          },
          {
            label: 'Total Outstanding',
            count: '',
            amount: `KSh ${(stats.totalOutstanding || calculatedPendingAmount).toLocaleString()}`,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10 border-cyan-500/20',
          },
        ].map((stat) => (
          <div key={stat.label} className={`glass-card p-4 border ${stat.bg}`}>
            <div className={`text-lg font-extrabold ${stat.color}`}>
              {stat.count !== '' ? stat.count : stat.amount}
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">{stat.label}</div>
            {stat.count !== '' && (
              <div className={`text-[10px] font-semibold mt-0.5 ${stat.color}`}>{stat.amount}</div>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by invoice number, customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="PARTIAL">Partial</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          Loading invoices...
        </div>
      ) : invoices.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <FileText className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="font-bold text-foreground">No invoices found</p>
          <p className="text-xs text-muted-foreground">
            No invoices matching the current criteria were found in the database.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-background/40">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Invoice #</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Paid</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Balance</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Due Date</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {invoices.map((inv) => {
                  const cfg = statusConfig[inv.status] || statusConfig.PENDING;
                  const StatusIcon = cfg.icon;
                  const isOverdue = inv.status === 'PENDING' && new Date(inv.dueDate) < new Date();

                  return (
                    <tr key={inv.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-primary">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {inv.customer?.firstName} {inv.customer?.lastName}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {inv.customer?.customerNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                        {inv.items?.[0]?.description || 'Monthly Subscription'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        KSh {Number(inv.total).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                        KSh {Number(inv.amountPaid).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span className={Number(inv.balance) > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          KSh {Number(inv.balance).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className={isOverdue ? 'text-rose-400 font-semibold' : ''}>
                          {new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                            isOverdue ? statusConfig.OVERDUE.color : cfg.color
                          }`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {isOverdue ? 'Overdue' : cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-background/40">
            <span className="text-[11px] text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{invoices.length}</span> of{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> invoices
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1 || isLoading}
                className="p-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || isLoading}
                className="p-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
