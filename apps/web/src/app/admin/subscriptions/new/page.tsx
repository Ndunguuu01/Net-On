'use client';

// ============================================
// Net-On — Admin: Create New Subscription
// ============================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Repeat,
  ArrowLeft,
  Search,
  CheckCircle2,
  Calendar,
  Zap,
  Loader2,
  AlertCircle,
  Package,
  User,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function NewSubscriptionPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoRenew, setAutoRenew] = useState(true);
  const [gracePeriodDays, setGracePeriodDays] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer search in dropdown
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, pkgRes]: [any, any] = await Promise.all([
          api.get('/customers', { limit: 100 }),
          api.get('/packages'),
        ]);

        const custList = custRes?.items || custRes?.data?.items || (Array.isArray(custRes) ? custRes : []);
        const pkgList = Array.isArray(pkgRes) ? pkgRes : pkgRes?.data || [];

        setCustomers(custList);
        setPackages(pkgList);

        if (custList.length > 0) setCustomerId(custList[0].id);
        if (pkgList.length > 0) setPackageId(pkgList[0].id);
      } catch (err: any) {
        console.error('Failed to load customers or packages:', err);
        setError('Failed to fetch customers and packages list.');
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !packageId) {
      setError('Please select both a customer and an internet package');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/subscriptions', {
        customerId,
        packageId,
        startDate: new Date(startDate).toISOString(),
        autoRenew,
        gracePeriodDays: Number(gracePeriodDays),
      });

      router.push('/admin/subscriptions');
    } catch (err: any) {
      setError(err.message || 'Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.firstName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.lastName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.customerNumber?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectedPackage = packages.find((p) => p.id === packageId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/subscriptions"
          className="p-2 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Repeat className="w-6 h-6 text-primary" />
            Assign New Subscription
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Provision an internet service tariff plan for a registered subscriber.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoadingData ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <span className="text-xs text-muted-foreground">Loading customers and packages...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection Card */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/40">
              <User className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Select Customer</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Search & Select Subscriber
                </label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerNumber} — {c.firstName} {c.lastName} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Package Selection Card */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/40">
              <Package className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-foreground">Select Package & Speed</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {packages.map((pkg) => {
                  const isSelected = pkg.id === packageId;
                  return (
                    <button
                      type="button"
                      key={pkg.id}
                      onClick={() => setPackageId(pkg.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-md shadow-primary/10'
                          : 'bg-background/40 border-border/40 hover:border-border/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-foreground text-sm">{pkg.name}</div>
                        <span className="text-xs font-mono font-bold text-primary">
                          KSh {pkg.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        ↓ {pkg.downloadSpeed} {pkg.speedUnit} / ↑ {pkg.uploadSpeed} {pkg.speedUnit}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedPackage && (
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center justify-between">
                  <span>Selected Package Price:</span>
                  <span className="font-bold font-mono">
                    KSh {selectedPackage.price.toLocaleString()} / {selectedPackage.durationDays || 30} Days
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Parameters Card */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/40">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-foreground">Billing & Lifecycle Parameters</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Activation Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Grace Period (Days)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={30}
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary/40 border-border"
              />
              <label htmlFor="autoRenew" className="text-xs text-foreground font-semibold cursor-pointer">
                Auto-Renew subscription and generate renewal invoice upon cycle expiry
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/admin/subscriptions"
              className="px-4 py-2.5 rounded-lg bg-accent/50 text-muted-foreground hover:text-foreground text-xs font-semibold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Provisioning...</span>
                </>
              ) : (
                <span>Activate Subscription</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
