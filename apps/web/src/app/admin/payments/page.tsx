'use client';

// ============================================
// Net-On — Admin Payments Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Phone,
  Banknote,
  Send,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface PaymentItem {
  id: string;
  amount: number;
  provider: string;
  transactionReference: string;
  providerTransactionId?: string;
  phoneNumber?: string;
  status: string;
  reconciliationStatus: string;
  paidAt?: string;
  createdAt: string;
  customer?: { id: string; customerNumber: string; firstName: string; lastName: string; phone: string };
  invoice?: { invoiceNumber: string; total: number; status: string };
}

const providerLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  MPESA: { label: 'M-Pesa Express', color: 'text-emerald-400', icon: Phone },
  MPESA_STK: { label: 'M-Pesa STK', color: 'text-emerald-400', icon: Phone },
  MPESA_MANUAL: { label: 'M-Pesa Manual', color: 'text-emerald-400', icon: Phone },
  MANUAL: { label: 'Manual Entry', color: 'text-blue-400', icon: CreditCard },
  CASH: { label: 'Cash', color: 'text-amber-400', icon: Banknote },
  BANK_TRANSFER: { label: 'Bank Transfer', color: 'text-blue-400', icon: CreditCard },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState<{ totalCollected: number; completedCount: number; pendingCount: number; failedCount: number }>({
    totalCollected: 0, completedCount: 0, pendingCount: 0, failedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showStkForm, setShowStkForm] = useState(false);
  const [stkPhone, setStkPhone] = useState('');
  const [stkAmount, setStkAmount] = useState('');
  const [isSendingStk, setIsSendingStk] = useState(false);
  const [stkSuccessMessage, setStkSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const [res, statsRes]: any = await Promise.allSettled([
        api.get('/payments', params),
        api.get('/payments/stats'),
      ]);

      if (res.status === 'fulfilled') {
        const val = res.value;
        const items = val?.items || val?.data?.items || (Array.isArray(val) ? val : []);
        const pages = val?.meta?.totalPages || val?.data?.meta?.totalPages || 1;
        const total = val?.meta?.total ?? val?.data?.meta?.total ?? items.length;

        setPayments(items);
        setTotalPages(pages);
        setTotalCount(total);
      } else {
        throw res.reason;
      }

      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value?.data || statsRes.value || {};
        setStats({
          totalCollected: s.totalCollected || s.totalAmount || 0,
          completedCount: s.completedCount || s.successCount || 0,
          pendingCount: s.pendingCount || 0,
          failedCount: s.failedCount || 0,
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch payments:', err);
      setError(err.message || 'Failed to load payments from API.');
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleStkPush = async () => {
    if (!stkPhone || !stkAmount) return;
    setIsSendingStk(true);
    setStkSuccessMessage(null);

    try {
      await api.post('/payments/stk-push', {
        phoneNumber: stkPhone,
        amount: Number(stkAmount),
        accountReference: 'NET-PORTAL',
        transactionDesc: 'Internet Subscription Renewal',
      });

      setStkSuccessMessage(`STK Push prompt dispatched to ${stkPhone} for KSh ${Number(stkAmount).toLocaleString()}.`);
      setStkPhone('');
      setStkAmount('');
      setTimeout(() => {
        fetchPayments();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch STK push.');
    } finally {
      setIsSendingStk(false);
    }
  };

  const completedTotal = stats.totalCollected || payments
    .filter((p) => p.status === 'SUCCESS' || p.status === 'COMPLETED')
    .reduce((s, p) => s + Number(p.amount), 0);

  const completedCount = stats.completedCount || payments
    .filter((p) => p.status === 'SUCCESS' || p.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            Payments & Transactions
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            M-Pesa STK Push, automated reconciliation, and cash transactions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStkForm(!showStkForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/30"
          >
            <Zap className="w-4 h-4" />
            <span>{showStkForm ? 'Close STK Form' : 'Initiate STK Push'}</span>
          </button>
          <button
            onClick={() => fetchPayments()}
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
          <button onClick={() => fetchPayments()} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* STK Push Form */}
      {showStkForm && (
        <div className="glass-card p-6 border-emerald-500/30 animate-in slide-in-from-top-2 duration-200">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" /> Dispatch M-Pesa Express STK Push
          </h3>

          {stkSuccessMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{stkSuccessMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Customer Phone (254XXXXXXXXX)
              </label>
              <input
                type="text"
                value={stkPhone}
                onChange={(e) => setStkPhone(e.target.value)}
                placeholder="254712345678"
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Amount (KES)
              </label>
              <input
                type="number"
                value={stkAmount}
                onChange={(e) => setStkAmount(e.target.value)}
                placeholder="2500"
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleStkPush}
                disabled={!stkPhone || !stkAmount || isSendingStk}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-all"
              >
                {isSendingStk ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send STK Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
          <div className="text-lg font-extrabold text-emerald-400">
            KSh {completedTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Total Collected</div>
        </div>
        <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
          <div className="text-lg font-extrabold text-emerald-400">{completedCount}</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Successful Transactions</div>
        </div>
        <div className="glass-card p-4 border bg-amber-500/10 border-amber-500/20">
          <div className="text-lg font-extrabold text-amber-400">
            {stats.pendingCount || payments.filter((p) => p.status === 'PENDING').length}
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Pending Settlement</div>
        </div>
        <div className="glass-card p-4 border bg-rose-500/10 border-rose-500/20">
          <div className="text-lg font-extrabold text-rose-400">
            {stats.failedCount || payments.filter((p) => p.status === 'FAILED').length}
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Failed / Cancelled</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by reference, phone, or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
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
          <option value="SUCCESS">Success / Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          Loading transactions...
        </div>
      ) : payments.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <CreditCard className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="font-bold text-foreground">No payments recorded</p>
          <p className="text-xs text-muted-foreground">
            No payments match the search criteria or filter.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-background/40">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Reference</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Provider</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {payments.map((pmt) => {
                  const prov = providerLabels[pmt.provider] || {
                    label: pmt.provider,
                    color: 'text-muted-foreground',
                    icon: CreditCard,
                  };
                  const ProvIcon = prov.icon;
                  const isSuccess = pmt.status === 'SUCCESS' || pmt.status === 'COMPLETED';
                  const isPending = pmt.status === 'PENDING';

                  const statusColor = isSuccess
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : isPending
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

                  return (
                    <tr key={pmt.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-[10px] font-bold text-primary">
                          {pmt.transactionReference}
                        </div>
                        {pmt.providerTransactionId && (
                          <div className="font-mono text-[9px] text-muted-foreground">
                            ID: {pmt.providerTransactionId}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {pmt.customer ? (
                          <>
                            <div className="font-semibold text-foreground">
                              {pmt.customer.firstName} {pmt.customer.lastName}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {pmt.customer.customerNumber}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground font-mono text-[11px]">Direct / Guest</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${prov.color}`}>
                          <ProvIcon className="w-3 h-3" />
                          {prov.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        KSh {Number(pmt.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-[10px]">
                        {pmt.phoneNumber || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColor}`}>
                          {isSuccess && <CheckCircle2 className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          {!isSuccess && !isPending && <XCircle className="w-3 h-3" />}
                          {pmt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-[10px]">
                        {new Date(pmt.paidAt || pmt.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        <div className="text-[9px]">
                          {new Date(pmt.paidAt || pmt.createdAt).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-background/40">
            <span className="text-[11px] text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{payments.length}</span> of{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> transactions
            </span>
            <div className="flex gap-2">
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
