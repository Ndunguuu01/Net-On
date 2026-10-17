'use client';

// ============================================
// Net-On — Admin System Settings Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Building,
  CreditCard,
  Router,
  Bell,
  Save,
  CheckCircle2,
  Shield,
  Phone,
  Mail,
  Zap,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function SystemSettingsPage() {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [ispName, setIspName] = useState('Net-On Kenya');
  const [ispPhone, setIspPhone] = useState('+254 700 000 000');
  const [ispEmail, setIspEmail] = useState('support@neton.co.ke');
  const [ispAddress, setIspAddress] = useState('Westlands, Nairobi, Kenya');
  const [currency, setCurrency] = useState('KES');
  const [gracePeriodDefault, setGracePeriodDefault] = useState('3');

  // M-Pesa
  const [mpesaMode, setMpesaMode] = useState('mock');
  const [shortcode, setShortcode] = useState('174379');
  const [consumerKey, setConsumerKey] = useState('************************');

  // Router
  const [mikrotikMode, setMikrotikMode] = useState('mock');
  const [defaultPort, setDefaultPort] = useState('8728');
  const [syncInterval, setSyncInterval] = useState('30');

  // SMS
  const [smsSenderId, setSmsSenderId] = useState('NET-ON');

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/settings');
      const settingsList: Array<{ key: string; value: string }> = Array.isArray(res)
        ? res
        : res?.data || [];

      settingsList.forEach((s) => {
        if (s.key === 'company_name') setIspName(s.value);
        if (s.key === 'currency') setCurrency(s.value);
        if (s.key === 'grace_period_days') setGracePeriodDefault(s.value);
        if (s.key === 'mpesa_mode') setMpesaMode(s.value);
        if (s.key === 'mikrotik_mode') setMikrotikMode(s.value);
      });
    } catch (err: any) {
      console.error('Failed to load system settings:', err);
      setError(err.message || 'Failed to load system settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await api.post('/settings', {
        settings: [
          { key: 'company_name', value: ispName },
          { key: 'currency', value: currency },
          { key: 'grace_period_days', value: gracePeriodDefault },
          { key: 'mpesa_mode', value: mpesaMode },
          { key: 'mikrotik_mode', value: mikrotikMode },
        ],
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            System Configuration
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Global ISP business parameters, Safaricom Daraja M-Pesa credentials, and RouterOS sync timers.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSaved ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Saving...' : isSaved ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {isSaved && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          System settings saved and synchronized with database!
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: ISP Business Profile */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <Building className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              ISP Organization & Invoicing Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Company / Brand Name</label>
              <input
                type="text"
                value={ispName}
                onChange={(e) => setIspName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Support Phone</label>
              <input
                type="text"
                value={ispPhone}
                onChange={(e) => setIspPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Billing Email</label>
              <input
                type="email"
                value={ispEmail}
                onChange={(e) => setIspEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Billing Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Safaricom M-Pesa Gateway */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Safaricom M-Pesa Daraja Gateway
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
              {mpesaMode === 'mock' ? 'MOCK MODE ACTIVE' : 'LIVE API'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Execution Mode</label>
              <select
                value={mpesaMode}
                onChange={(e) => setMpesaMode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="mock">Development Mock (Simulated STK)</option>
                <option value="sandbox">Safaricom Sandbox</option>
                <option value="production">Production Live Paybill</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Business Shortcode (Paybill)</label>
              <input
                type="text"
                value={shortcode}
                onChange={(e) => setShortcode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Consumer Secret</label>
              <input
                type="password"
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>
        </div>

        {/* Section 3: MikroTik RouterOS Engine */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Router className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                MikroTik RouterOS Network Engine
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
              {mikrotikMode === 'mock' ? 'MOCK DRIVER' : 'ROUTEROS V7'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Driver Mode</label>
              <select
                value={mikrotikMode}
                onChange={(e) => setMikrotikMode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <option value="mock">Mock Network Adapter (Dev)</option>
                <option value="live">Live RouterOS API (TCP 8728)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Default API Port</label>
              <input
                type="number"
                value={defaultPort}
                onChange={(e) => setDefaultPort(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Sync Heartbeat Interval</label>
              <input
                type="number"
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
                placeholder="30 seconds"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
          </div>
        </div>

        {/* Section 4: SMS Gateway */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <Bell className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              SMS Gateway (Africa's Talking)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Alphanumeric Sender ID</label>
              <input
                type="text"
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Default Grace Period (Days)</label>
              <input
                type="number"
                value={gracePeriodDefault}
                onChange={(e) => setGracePeriodDefault(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
