'use client';

// ============================================
// Net-On — Customer Portal: Invoices
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  Send,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  tax?: number;
  taxAmount?: number;
  total?: number;
  totalAmount?: number;
  amountPaid?: number;
  paidAmount?: number;
  balance?: number;
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | string;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total?: number;
    amount?: number;
  }>;
  lineItems?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

const statusBadges: Record<string, { label: string; color: string }> = {
  PAID: { label: 'Paid', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  PENDING: { label: 'Unpaid', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  OVERDUE: { label: 'Overdue', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  PARTIALLY_PAID: { label: 'Partial', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  CANCELLED: { label: 'Cancelled', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // M-Pesa modal state
  const [selectedInvoice, setSelectedInvoice] = useState<PortalInvoice | null>(null);
  const [payPhone, setPayPhone] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/portal/invoices');
      const items = res?.items || res?.data?.items || (Array.isArray(res) ? res : []);
      setInvoices(items);
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
      setError(err.message || 'Failed to load your invoices.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setIsPaying(true);
    setPaySuccess(null);

    try {
      const res: any = await api.post('/portal/pay', {
        invoiceId: selectedInvoice.id,
        phone: payPhone,
      });
      const paymentData = res?.data || res;
      setPaySuccess(paymentData.message || `M-Pesa payment prompt dispatched!`);
      setTimeout(() => {
        setSelectedInvoice(null);
        setPaySuccess(null);
        fetchInvoices();
      }, 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to initiate M-Pesa payment');
    } finally {
      setIsPaying(false);
    }
  };

  const getInvoiceTotal = (inv: PortalInvoice) => Number(inv.total ?? inv.totalAmount ?? 0);
  const getInvoicePaid = (inv: PortalInvoice) => Number(inv.amountPaid ?? inv.paidAmount ?? 0);
  const getInvoiceBalance = (inv: PortalInvoice) => Number(inv.balance ?? (getInvoiceTotal(inv) - getInvoicePaid(inv)));

  const outstandingTotal = invoices
    .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE' || i.status === 'PARTIALLY_PAID')
    .reduce((sum, i) => sum + getInvoiceBalance(i), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            My Invoices & Bills
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review monthly billing invoices, payment statuses, and settle dues via M-Pesa.
          </p>
        </div>

        <button
          onClick={fetchInvoices}
          disabled={isLoading}
          className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors self-start sm:self-center disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Outstanding Summary Ribbon */}
      <div className="glass-card p-6 border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] text-muted-foreground uppercase font-semibold">Total Outstanding Balance</div>
          <div className={`text-3xl font-black ${outstandingTotal > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            KSh {outstandingTotal.toLocaleString()}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {invoices.filter((i) => i.status === 'PAID').length} Paid • {invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE').length} Pending
        </div>
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <div className="text-xs text-muted-foreground">Loading your invoices...</div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-foreground">No Invoices Issued</h3>
          <p className="text-xs text-muted-foreground">
            You currently have no billing invoices issued to your account.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const badge = statusBadges[invoice.status] || statusBadges.PENDING;
            const total = getInvoiceTotal(invoice);
            const balance = getInvoiceBalance(invoice);
            const isUnpaid = invoice.status === 'PENDING' || invoice.status === 'OVERDUE' || invoice.status === 'PARTIALLY_PAID';
            const firstItem = (invoice.items || invoice.lineItems)?.[0];

            return (
              <div
                key={invoice.id}
                className="glass-card p-5 hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{invoice.invoiceNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-foreground">
                    {firstItem?.description || 'Monthly Internet Service'}
                  </div>

                  <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                    <span>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-base font-bold text-foreground">
                      KSh {total.toLocaleString()}
                    </div>
                    {isUnpaid && balance < total && (
                      <div className="text-[10px] text-amber-400 font-mono">
                        Balance: KSh {balance.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/portal/invoices/${invoice.id}`}
                      className="p-2 rounded-lg bg-card/60 border border-border/40 hover:text-primary hover:bg-accent/50 text-muted-foreground transition-colors"
                      title="View Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {isUnpaid && (
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Pay</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pay Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-5 border-emerald-500/30 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">M</span>
                Pay Invoice {selectedInvoice.invoiceNumber}
              </h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            {paySuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <p className="font-bold text-sm">Payment Initiated!</p>
                <p className="text-xs text-muted-foreground">{paySuccess}</p>
              </div>
            ) : (
              <form onSubmit={handlePayInvoice} className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-background/60 border border-border/40 space-y-1">
                  <div className="text-[11px] text-muted-foreground uppercase font-semibold">Amount to Pay</div>
                  <div className="text-2xl font-black text-foreground">
                    KSh {getInvoiceBalance(selectedInvoice).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Invoice: {selectedInvoice.invoiceNumber}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1.5">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={payPhone}
                    onChange={(e) => setPayPhone(e.target.value)}
                    placeholder="254712345678"
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    You will receive an M-Pesa prompt on your phone to enter your PIN.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="px-4 py-2 rounded-lg bg-accent/50 text-muted-foreground hover:text-foreground text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPaying}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
