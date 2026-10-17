'use client';

// ============================================
// Net-On — Customer Portal: My Subscription
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Repeat,
  Zap,
  ArrowDown,
  ArrowUp,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function PortalSubscriptionPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/portal/subscription');
      const items = Array.isArray(res) ? res : res?.data || [];
      setSubscriptions(items);
    } catch (err: any) {
      console.error('Failed to load subscription:', err);
      setError(err.message || 'Failed to load subscription information.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const activeSub = subscriptions.find((s) => s.status === 'ACTIVE' || s.status === 'EXPIRING' || s.status === 'GRACE_PERIOD') || subscriptions[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Repeat className="w-6 h-6 text-primary" />
            My Internet Plan
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Current subscription details, speed profile, and renewal timeline.
          </p>
        </div>

        <button
          onClick={fetchSubscriptions}
          className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors self-start sm:self-center"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <div className="text-xs text-muted-foreground">Loading subscription details...</div>
        </div>
      ) : !activeSub ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Repeat className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-foreground">No Subscriptions Found</h3>
          <p className="text-xs text-muted-foreground">
            You do not currently have any registered internet subscriptions on your account.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Plan Detail Box */}
          <div className="glass-card p-6 sm:p-8 border-primary/30 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    activeSub.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : activeSub.status === 'GRACE_PERIOD'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {activeSub.status}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">ID: {activeSub.id.slice(0, 8)}...</span>
                </div>
                <h2 className="text-2xl font-black text-foreground">{activeSub.package?.name || 'Home Fiber'}</h2>
                <p className="text-xs text-muted-foreground">{activeSub.package?.description || 'Unlimited high-speed fiber internet'}</p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-3xl font-black text-foreground">
                  KSh {activeSub.package?.price?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-muted-foreground">Billed monthly</div>
              </div>
            </div>

            {/* Speeds */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-background/50 border border-border/40">
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold mb-1">
                  <ArrowDown className="w-4 h-4" />
                  <span>Download Speed</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {activeSub.package?.downloadSpeed} <span className="text-xs text-muted-foreground font-normal">{activeSub.package?.speedUnit || 'Mbps'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/40">
                <div className="flex items-center gap-1.5 text-primary text-xs font-semibold mb-1">
                  <ArrowUp className="w-4 h-4" />
                  <span>Upload Speed</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {activeSub.package?.uploadSpeed} <span className="text-xs text-muted-foreground font-normal">{activeSub.package?.speedUnit || 'Mbps'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/40">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Validity & Expiry</span>
                </div>
                <div className="text-sm font-bold text-foreground truncate mt-1">
                  {new Date(activeSub.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Timeline Info */}
            <div className="p-4 rounded-xl bg-card/40 border border-border/30 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Start Date</span>
                <div className="font-semibold text-foreground mt-0.5">
                  {new Date(activeSub.startDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Renewal Date</span>
                <div className="font-semibold text-foreground mt-0.5">
                  {new Date(activeSub.expiryDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Auto-Renew</span>
                <div className="font-semibold text-foreground mt-0.5">
                  {activeSub.autoRenew ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Grace Period</span>
                <div className="font-semibold text-foreground mt-0.5">
                  {activeSub.gracePeriodDays || 3} Days
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Request Banner */}
          <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-cyan-500/20">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Want Faster Internet?
              </h3>
              <p className="text-xs text-muted-foreground">
                Request a tariff upgrade or bandwidth boost directly from your customer portal.
              </p>
            </div>
            <Link
              href="/portal/support"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30 text-xs font-bold transition-all"
            >
              <span>Request Upgrade</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
