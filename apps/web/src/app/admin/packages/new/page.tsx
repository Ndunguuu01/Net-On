'use client';

// ============================================
// Net-On — Create Internet Package Page
// ============================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  DollarSign,
  Clock,
  Router,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function NewPackagePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '3000',
    billingCycle: 'MONTHLY',
    durationDays: '30',
    downloadSpeed: '20',
    uploadSpeed: '20',
    speedUnit: 'Mbps',
    gracePeriodDays: '3',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calculatedRateLimit = `${formData.uploadSpeed}M/${formData.downloadSpeed}M`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await api.post('/packages', {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        billingCycle: formData.billingCycle,
        durationDays: parseInt(formData.durationDays, 10),
        downloadSpeed: parseInt(formData.downloadSpeed, 10),
        uploadSpeed: parseInt(formData.uploadSpeed, 10),
        speedUnit: formData.speedUnit,
        gracePeriodDays: parseInt(formData.gracePeriodDays, 10),
      });

      router.push('/admin/packages');
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to create internet package. Please check inputs.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/packages"
          className="p-2 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Create Internet Package
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure package name, pricing, speed limits, and grace period settings.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Creation Failed</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="glass-card p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Package Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Package Identity & Description
            </h3>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Package Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Home Fiber 20M"
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. Recommended for HD streaming, gaming, and multi-device home use..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="border-t border-border/40" />

          {/* Pricing & Billing Cycle */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Pricing & Billing Cycle
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Monthly Price (KSh) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="3000"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Billing Cycle
                </label>
                <select
                  name="billingCycle"
                  value={formData.billingCycle}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="DAILY">Daily</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  name="durationDays"
                  value={formData.durationDays}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border/40" />

          {/* Bandwidth Speed Specs & MikroTik Preview */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Bandwidth Speed & RouterOS Rate Limit
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Download Speed (Mbps) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  name="downloadSpeed"
                  value={formData.downloadSpeed}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="20"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Upload Speed (Mbps) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  name="uploadSpeed"
                  value={formData.uploadSpeed}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="20"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* MikroTik Rate Limit String Live Preview */}
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Router className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-400">
                  Auto-Generated MikroTik Rate-Limit String:
                </span>
              </div>
              <span className="font-mono font-extrabold text-sm text-cyan-300 bg-background/60 px-3 py-1 rounded border border-cyan-500/30">
                {calculatedRateLimit}
              </span>
            </div>
          </div>

          <div className="border-t border-border/40" />

          {/* Grace Period */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Grace Period (Days After Expiry)
            </label>
            <input
              type="number"
              name="gracePeriodDays"
              value={formData.gracePeriodDays}
              onChange={handleChange}
              min="0"
              max="30"
              className="w-full sm:w-48 px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
            <span className="text-[10px] text-muted-foreground mt-1 block">
              Days allowed before subscriber is automatically suspended by the billing engine.
            </span>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
            <Link
              href="/admin/packages"
              className="px-4 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Package...</span>
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  <span>Save Internet Package</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
