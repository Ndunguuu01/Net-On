'use client';

// ============================================
// Net-On — Admin Network Overview Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Wifi,
  Server,
  Users,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface NetworkAccountItem {
  id: string;
  username: string;
  status: string;
  syncStatus: string;
  ipAddress?: string;
  macAddress?: string;
  authenticationMethod: string;
  lastSyncedAt?: string;
  createdAt: string;
  customer: { id: string; customerNumber: string; firstName: string; lastName: string; phone: string };
  router: { id: string; name: string; managementIp: string };
  networkProfile?: { name: string; rateLimitString: string };
}

export default function NetworkOverviewPage() {
  const [accounts, setAccounts] = useState<NetworkAccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res: any = await api.get('/network/accounts', params);
      const items = res?.items || (Array.isArray(res) ? res : []);
      const pages = res?.meta?.totalPages || 1;
      const total = res?.meta?.total ?? items.length;

      setAccounts(items);
      setTotalPages(pages);
      setTotalCount(total);
    } catch (err: any) {
      console.error('Failed to fetch network accounts:', err);
      setError(err.message || 'Failed to load network accounts.');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const syncStatusColor = (status: string) => {
    switch (status) {
      case 'SYNCED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'PENDING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'FAILED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-muted-foreground bg-card/60 border-border/40';
    }
  };

  const accountStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'PENDING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'DISABLED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-muted-foreground bg-card/60 border-border/40';
    }
  };

  const activeCount = accounts.filter(a => a.status === 'ACTIVE').length;
  const pendingCount = accounts.filter(a => a.status === 'PENDING').length;
  const syncedCount = accounts.filter(a => a.syncStatus === 'SYNCED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Network Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage PPPoE/Hotspot accounts, sync status, and router connectivity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/network/live"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/30"
          >
            <Wifi className="w-4 h-4" />
            <span>Live Sessions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => fetchAccounts()}
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
          <button onClick={() => fetchAccounts()} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 border bg-primary/10 border-primary/20">
          <div className="text-lg font-extrabold text-primary">{totalCount}</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Total Accounts</div>
        </div>
        <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
          <div className="text-lg font-extrabold text-emerald-400">{activeCount}</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Active</div>
        </div>
        <div className="glass-card p-4 border bg-amber-500/10 border-amber-500/20">
          <div className="text-lg font-extrabold text-amber-400">{pendingCount}</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Pending Sync</div>
        </div>
        <div className="glass-card p-4 border bg-cyan-500/10 border-cyan-500/20">
          <div className="text-lg font-extrabold text-cyan-400">{syncedCount}</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Synced to Router</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by username, customer name, IP address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAccounts()}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="DISABLED">Disabled</option>
        </select>
      </div>

      {/* Accounts Table */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          Loading network accounts...
        </div>
      ) : accounts.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Activity className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="font-bold text-foreground">No network accounts</p>
          <p className="text-xs text-muted-foreground">
            Network accounts are created when customers are provisioned.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-background/40">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Username</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Router</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Profile</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">IP / MAC</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] font-bold text-primary">{acc.username}</span>
                      <div className="text-[9px] text-muted-foreground">{acc.authenticationMethod}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {acc.customer.firstName} {acc.customer.lastName}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">{acc.customer.customerNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground text-[11px]">{acc.router.name}</div>
                      <div className="text-[9px] text-muted-foreground font-mono">{acc.router.managementIp}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-foreground text-[11px]">
                        {acc.networkProfile?.name || '—'}
                      </span>
                      {acc.networkProfile?.rateLimitString && (
                        <div className="text-[9px] text-muted-foreground font-mono">{acc.networkProfile.rateLimitString}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">
                      <div>{acc.ipAddress || '—'}</div>
                      <div>{acc.macAddress || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${accountStatusColor(acc.status)}`}>
                        {acc.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3" />}
                        {acc.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {acc.status === 'DISABLED' && <XCircle className="w-3 h-3" />}
                        {acc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${syncStatusColor(acc.syncStatus)}`}>
                        {acc.syncStatus}
                      </span>
                      {acc.lastSyncedAt && (
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          {new Date(acc.lastSyncedAt).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-background/40">
              <span className="text-[11px] text-muted-foreground">
                Page <span className="font-semibold text-foreground">{page}</span> of{' '}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-border/40 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border/40 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
