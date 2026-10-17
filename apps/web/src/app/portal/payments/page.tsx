'use client';

// ============================================
// Net-On — Customer Portal: Payment History
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface PaymentItem {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionReference: string;
  mpesaReceiptNumber?: string;
  paidAt?: string;
  createdAt: string;
}

export default function PortalPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/portal/payments');
      const items = res?.items || res?.data?.items || (Array.isArray(res) ? res : []);
      setPayments(items);
    } catch (err: any) {
      console.error('Failed to load payments:', err);
      setError(err.message || 'Failed to load payments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalPaid = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Payment History & Receipts
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Complete record of your M-Pesa and manual subscription payments.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={isLoading}
          className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors self-start sm:self-center disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
          <div className="text-2xl font-black text-emerald-400">
            KSh {totalPaid.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Lifetime Payments Made</div>
        </div>

        <div className="glass-card p-4 border bg-primary/10 border-primary/20">
          <div className="text-2xl font-black text-foreground">
            {payments.filter((p) => p.status === 'COMPLETED').length} Transactions
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Successfully Processed</div>
        </div>
      </div>

      {/* Payments Table */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <div className="text-xs text-muted-foreground">Loading transaction records...</div>
        </div>
      ) : payments.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <CreditCard className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-foreground">No Payments Recorded</h3>
          <p className="text-xs text-muted-foreground">
            You have not made any payments on your account yet.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-background/40">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Method</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Reference / Receipt</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                      {new Date(p.paidAt || p.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {p.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-foreground">
                      {p.mpesaReceiptNumber || p.transactionReference}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                      KSh {p.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          p.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
