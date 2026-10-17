'use client';

// ============================================
// Net-On — Customer Portal Dashboard
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wifi,
  ArrowDown,
  ArrowUp,
  CreditCard,
  FileText,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Phone,
  RefreshCw,
  Send,
  Loader2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface PortalDashboardData {
  customer: {
    id: string;
    customerNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    status: string;
  };
  subscription: {
    id: string;
    status: string;
    packageName: string;
    downloadSpeed: number;
    uploadSpeed: number;
    speedUnit: string;
    price: number;
    startDate: string;
    expiryDate: string;
    daysToExpiry: number | null;
    autoRenew: boolean;
  } | null;
  billing: {
    outstandingBalance: number;
    unpaidInvoices: number;
    latestPayment: {
      amount: number;
      method: string;
      paidAt: string;
      transactionRef: string;
    } | null;
  };
  openTickets: number;
}

export default function PortalDashboard() {
  const [data, setData] = useState<PortalDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // M-Pesa quick pay modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payPhone, setPayPhone] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/portal/dashboard');
      const dashboardData = res?.data || res;
      setData(dashboardData);
      if (dashboardData?.customer?.phone) {
        setPayPhone(dashboardData.customer.phone);
      }
    } catch (err: any) {
      console.error('Failed to load portal dashboard:', err);
      setError(err.message || 'Failed to load your account dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.billing.outstandingBalance || data.billing.outstandingBalance <= 0) return;
    setIsPaying(true);
    setPaySuccess(null);

    try {
      const res: any = await api.post('/portal/pay', {
        amount: data.billing.outstandingBalance,
        phone: payPhone,
      });
      const paymentData = res?.data || res;
      setPaySuccess(paymentData.message || `M-Pesa payment prompt sent to ${payPhone}!`);
      setTimeout(() => {
        setShowPayModal(false);
        fetchDashboard();
      }, 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to initiate M-Pesa checkout');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        <div className="text-xs text-muted-foreground">Loading your account details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <h3 className="font-bold text-foreground">Could not load portal data</h3>
        <p className="text-xs text-muted-foreground">{error || 'Please check your connection and try again.'}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { customer, subscription, billing } = data;
  const isExpired = subscription?.status === 'EXPIRED';
  const isGrace = subscription?.status === 'GRACE_PERIOD';
  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'EXPIRING';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-primary/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {customer.status}
            </span>
            <span className="text-xs font-mono text-muted-foreground font-semibold">{customer.customerNumber}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome, {customer.firstName} {customer.lastName} 👋
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your high-speed fiber connection, invoices, and instant M-Pesa renewals.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 self-start sm:self-center transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Plan & Speed Hero Card */}
      {subscription ? (
        <div className="glass-card p-6 sm:p-8 border-primary/30 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Active Internet Subscription</span>
                <h2 className="text-2xl font-black text-foreground mt-0.5">{subscription.packageName}</h2>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-2xl font-extrabold text-foreground">
                  KSh {subscription.price.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground"> / month</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  Renews: {new Date(subscription.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Speeds Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-background/50 border border-border/40 text-center">
                <div className="flex items-center justify-center gap-1 text-cyan-400 text-xs font-semibold mb-1">
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Download</span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {subscription.downloadSpeed} <span className="text-xs text-muted-foreground font-normal">{subscription.speedUnit}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/40 text-center">
                <div className="flex items-center justify-center gap-1 text-primary text-xs font-semibold mb-1">
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {subscription.uploadSpeed} <span className="text-xs text-muted-foreground font-normal">{subscription.speedUnit}</span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-background/50 border border-border/40 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Time Remaining</span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {subscription.daysToExpiry !== null ? (
                    subscription.daysToExpiry > 0 ? (
                      `${subscription.daysToExpiry} days`
                    ) : (
                      <span className="text-rose-400">Expired</span>
                    )
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            </div>

            {/* Status Alert if Grace or Expired */}
            {isGrace && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Your subscription is in grace period. Please pay to avoid service interruption.</span>
                </div>
                <button
                  onClick={() => setShowPayModal(true)}
                  className="font-bold underline hover:text-amber-300"
                >
                  Pay Now
                </button>
              </div>
            )}

            {isExpired && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Your connection is currently paused due to expiry. Renew now for instant reactivation!</span>
                </div>
                <button
                  onClick={() => setShowPayModal(true)}
                  className="font-bold underline hover:text-rose-300"
                >
                  Renew Connection
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center space-y-3">
          <Wifi className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-foreground">No Active Plan Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You do not have an active internet subscription. Contact Net-On support to get connected.
          </p>
        </div>
      )}

      {/* 2-Column Grid: Billing Summary & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Billing Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Billing & Invoices</h3>
            </div>
            <Link href="/portal/invoices" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
              <span>View Invoices</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/40">
              <div>
                <div className="text-[11px] text-muted-foreground uppercase font-semibold">Outstanding Balance</div>
                <div className={`text-2xl font-black ${billing.outstandingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  KSh {billing.outstandingBalance.toLocaleString()}
                </div>
              </div>

              {billing.outstandingBalance > 0 && (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Pay via M-Pesa</span>
                </button>
              )}
            </div>

            {billing.latestPayment && (
              <div className="text-xs space-y-1 pt-1">
                <div className="text-[11px] text-muted-foreground font-semibold">Latest Payment:</div>
                <div className="p-3 rounded-lg bg-card/40 border border-border/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>KSh {billing.latestPayment.amount.toLocaleString()} ({billing.latestPayment.method})</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(billing.latestPayment.paidAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links / Support Box */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-foreground">Helpdesk & Support</h3>
            </div>
            <Link href="/portal/support" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
              <span>Open Tickets ({data.openTickets})</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-muted-foreground">
              Experiencing slow speeds or fiber line issues? Open a support ticket directly with our NOC technicians.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href="/portal/support"
                className="p-3 rounded-lg bg-card/60 border border-border/40 hover:border-primary/40 text-center font-semibold text-foreground hover:text-primary transition-colors block"
              >
                + New Support Ticket
              </Link>
              <Link
                href="/portal/payments"
                className="p-3 rounded-lg bg-card/60 border border-border/40 hover:border-primary/40 text-center font-semibold text-foreground hover:text-primary transition-colors block"
              >
                Payment Receipts
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* M-Pesa STK Push Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-5 border-emerald-500/30 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <h3 className="font-bold text-base text-foreground">Safaricom M-Pesa Checkout</h3>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            {paySuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <p className="font-bold text-sm">STK Push Sent!</p>
                <p className="text-xs text-muted-foreground">{paySuccess}</p>
              </div>
            ) : (
              <form onSubmit={handlePayNow} className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-background/60 border border-border/40 space-y-1">
                  <div className="text-[11px] text-muted-foreground uppercase font-semibold">Amount to Pay</div>
                  <div className="text-2xl font-black text-foreground">
                    KSh {billing.outstandingBalance.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    Paybill: 174379 • Account: {customer.customerNumber}
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
                    onClick={() => setShowPayModal(false)}
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
                        <span>Sending Prompt...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send M-Pesa Prompt</span>
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
