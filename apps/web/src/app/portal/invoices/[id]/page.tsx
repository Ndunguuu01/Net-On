'use client';

// ============================================
// Net-On — Customer Portal: Invoice Detail View
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  FileText,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function PortalInvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/portal/invoices/${id}`);
      setInvoice(res?.data || res);
    } catch (err: any) {
      console.error('Failed to load invoice:', err);
      setError(err.message || 'Invoice not found');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id, fetchInvoice]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        <div className="text-xs text-muted-foreground">Loading invoice details...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8 text-center space-y-3">
        <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
        <h3 className="font-bold text-foreground">Invoice Not Found</h3>
        <p className="text-xs text-muted-foreground">{error || 'Could not find the requested invoice.'}</p>
        <Link
          href="/portal/invoices"
          className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to invoices</span>
        </Link>
      </div>
    );
  }

  const isPaid = invoice.status === 'PAID';

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Top Action Bar (hidden on print) */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link
          href="/portal/invoices"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card/60 border border-border/50 text-foreground hover:bg-accent/50 text-xs font-semibold transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Printable Invoice Container */}
      <div className="glass-card p-8 sm:p-10 space-y-8 bg-card border-border/60 shadow-xl print:shadow-none print:border-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-border/40 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                N
              </div>
              <div>
                <span className="font-bold text-lg text-foreground">Net-On Kenya ISP</span>
                <span className="block text-[10px] text-muted-foreground">High-Speed Fiber Provider</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5 pt-2">
              <div>Delta Towers, 4th Floor, Westlands</div>
              <div>Nairobi, Kenya</div>
              <div>support@neton.co.ke • +254 700 000 000</div>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">INVOICE</h1>
            <div className="font-mono text-sm font-bold text-primary">{invoice.invoiceNumber}</div>
            <div className="pt-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                  isPaid
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Bill To & Invoice Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Billed To:</span>
            <div className="text-sm font-bold text-foreground">
              {invoice.customer?.firstName} {invoice.customer?.lastName}
            </div>
            <div className="text-muted-foreground font-mono">{invoice.customer?.customerNumber}</div>
            <div className="text-muted-foreground">{invoice.customer?.phone}</div>
            <div className="text-muted-foreground">{invoice.customer?.address || invoice.customer?.installationAddress || 'Nairobi'}</div>
          </div>

          <div className="space-y-2 sm:text-right">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Issue Date:</span>
              <span className="font-semibold text-foreground">{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Due Date:</span>
              <span className="font-semibold text-foreground">{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</span>
            </div>
            {invoice.paidAt && (
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Date Paid:</span>
                <span className="font-semibold text-emerald-400">{new Date(invoice.paidAt).toLocaleDateString('en-GB')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-hidden border border-border/40 rounded-xl">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-background/80 border-b border-border/40 text-muted-foreground text-[10px] uppercase font-semibold">
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-center px-4 py-3">Qty</th>
                <th className="text-right px-4 py-3">Unit Price</th>
                <th className="text-right px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {(invoice.items || invoice.lineItems || []).map((item: any) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-semibold text-foreground">{item.description}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{item.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    KSh {Number(item.unitPrice).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                    KSh {Number(item.total ?? item.amount ?? (item.unitPrice * item.quantity)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Calculation */}
        <div className="flex justify-end pt-2 text-xs">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-mono">KSh {Number(invoice.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (VAT 16%):</span>
              <span className="font-mono">KSh {Number(invoice.tax ?? invoice.taxAmount ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border/40">
              <span>Total Due:</span>
              <span className="font-mono text-primary">KSh {Number(invoice.total ?? invoice.totalAmount ?? 0).toLocaleString()}</span>
            </div>
            {(invoice.amountPaid || invoice.paidAmount) > 0 && (
              <div className="flex justify-between text-emerald-400 pt-1 font-semibold">
                <span>Amount Paid:</span>
                <span className="font-mono">- KSh {Number(invoice.amountPaid ?? invoice.paidAmount).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment instructions */}
        <div className="p-4 rounded-xl bg-background/50 border border-border/40 text-[11px] text-muted-foreground space-y-1">
          <div className="font-bold text-foreground uppercase tracking-wider text-[10px]">Payment Instructions:</div>
          <div>Lipa na M-Pesa • Paybill: <span className="font-mono font-bold text-foreground">174379</span></div>
          <div>Account Number: <span className="font-mono font-bold text-foreground">{invoice.customer?.customerNumber}</span></div>
        </div>
      </div>
    </div>
  );
}
