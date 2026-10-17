'use client';

// ============================================
// Net-On — Admin Audit Activity Logs Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter,
  Key,
  Database,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  result: 'SUCCESS' | 'FAILURE' | 'WARNING' | string;
  createdAt: string;
  user?: {
    email: string;
    role: string;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/audit', { limit: 50 });
      const items = res?.items || res?.data?.items || (Array.isArray(res) ? res : []);
      setLogs(items);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      setError(err.message || 'Failed to load audit logs.');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase()) ||
      (l.resourceId && l.resourceId.toLowerCase().includes(search.toLowerCase())) ||
      (l.user && l.user.email.toLowerCase().includes(search.toLowerCase()));
    const matchesAction = actionFilter ? l.action.includes(actionFilter) || l.resource.includes(actionFilter) : true;
    return matchesSearch && matchesAction;
  });

  const successCount = logs.filter((l) => l.result === 'SUCCESS').length;
  const failureCount = logs.filter((l) => l.result === 'FAILURE' || l.result === 'DENIED').length;
  const successRate = logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Audit & Security Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Immutable log trail of administrative actions, billing transactions, and RouterOS API mutations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLogs()}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
            title="Refresh logs"
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
          <button onClick={() => fetchLogs()} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
          <div className="text-2xl font-extrabold text-emerald-400">{successRate}%</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Success Rate</div>
        </div>
        <div className="glass-card p-4 border bg-primary/10 border-primary/20">
          <div className="text-2xl font-extrabold text-foreground">{logs.length}</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Total Events Recorded</div>
        </div>
        <div className="glass-card p-4 border bg-rose-500/10 border-rose-500/20">
          <div className="text-2xl font-extrabold text-rose-400">{failureCount}</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Failed / Denied Events</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search audit trail by user, action, resource ID, or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Action Types</option>
          <option value="LOGIN">Auth & Logins</option>
          <option value="PAYMENT">Payments</option>
          <option value="CUSTOMER">Customer Records</option>
          <option value="SUBSCRIPTION">Subscriptions</option>
          <option value="INVOICE">Invoices</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          Loading audit events...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <ShieldCheck className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="font-bold text-foreground">No audit entries found</p>
          <p className="text-xs text-muted-foreground">
            System actions and mutations will be permanently logged here.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-background/40">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">User / Identity</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Resource / Target</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">IP Address</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="px-4 py-3">
                      {log.user ? (
                        <div>
                          <div className="font-semibold text-foreground">{log.user.email}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-mono">{log.user.role}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Anonymous / System</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-primary text-[11px] bg-primary/10 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-foreground">
                      {log.resourceId || log.resource}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-cyan-400">
                      {log.ipAddress || '—'}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.result === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {log.result}
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
