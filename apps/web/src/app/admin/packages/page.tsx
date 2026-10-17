'use client';

// ============================================
// Net-On — Admin Packages Catalog Page
// ============================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Zap,
  Users,
  Clock,
  Trash2,
  Edit,
  CheckCircle2,
  RefreshCw,
  Router,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface PackageItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingCycle: string;
  durationDays: number;
  downloadSpeed: number;
  uploadSpeed: number;
  speedUnit: string;
  gracePeriodDays: number;
  status: string;
  networkProfile?: {
    rateLimitString: string;
  };
  _count?: {
    subscriptions: number;
  };
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/packages');
      const items = Array.isArray(res) ? res : res?.data || [];
      setPackages(items);
    } catch (err: any) {
      console.error('Failed to fetch packages:', err);
      setError(err.message || 'Failed to load packages from API.');
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive package "${name}"?`)) return;
    try {
      await api.delete(`/packages/${id}`);
      await fetchPackages();
    } catch (err: any) {
      alert(err.message || 'Failed to archive package');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Internet Packages Catalog
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure speed tiers, monthly pricing, and MikroTik rate-limit profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPackages}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
            title="Refresh Packages"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/admin/packages/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Package</span>
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
          <button onClick={fetchPackages} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Package Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          <span>Loading package catalog...</span>
        </div>
      ) : packages.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Packages Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Get started by creating your first ISP internet package and bandwidth rate limit profile.
            </p>
          </div>
          <Link
            href="/admin/packages/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Package</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="glass-card p-6 flex flex-col justify-between relative group hover:border-primary/40 transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Header: Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {pkg.description || 'Standard high-speed internet package.'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    pkg.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-muted/30 text-muted-foreground border-border'
                  }`}>
                    {pkg.status}
                  </span>
                </div>

                {/* Price Banner */}
                <div className="py-3 px-4 rounded-xl bg-background/50 border border-border/40 flex items-baseline justify-between">
                  <div className="text-2xl font-extrabold text-foreground">
                    KSh {Number(pkg.price).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold">
                    per {pkg.durationDays} days
                  </div>
                </div>

                {/* Speed & RouterOS Specs */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      Speed Tier
                    </span>
                    <span className="font-bold text-foreground">
                      {pkg.downloadSpeed} {pkg.speedUnit} Down / {pkg.uploadSpeed} {pkg.speedUnit} Up
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Router className="w-3.5 h-3.5 text-cyan-400" />
                      MikroTik Rate Limit
                    </span>
                    <span className="font-mono text-[11px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                      {pkg.networkProfile?.rateLimitString || `${pkg.uploadSpeed}M/${pkg.downloadSpeed}M`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Grace Period
                    </span>
                    <span className="font-semibold text-foreground">
                      {pkg.gracePeriodDays} Days
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer: Subscriber Count & Actions */}
              <div className="pt-5 mt-5 border-t border-border/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="font-semibold text-foreground">
                    {pkg._count?.subscriptions || 0}
                  </span>{' '}
                  active subscribers
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleArchive(pkg.id, pkg.name)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Archive Package"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
