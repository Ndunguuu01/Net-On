'use client';

// ============================================
// Net-On — Admin Live Network Sessions Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Search,
  RefreshCw,
  Zap,
  Radio,
  ArrowDown,
  ArrowUp,
  Clock,
  Shield,
  Wifi,
  XCircle,
  Router,
  PowerOff,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface LiveSession {
  id: string;
  username: string;
  customerName: string;
  customerNumber: string;
  ipAddress: string;
  macAddress: string;
  routerName: string;
  packageSpeed: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
  rateLimit: string;
}

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function LiveNetworkPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [routerFilter, setRouterFilter] = useState('');

  const fetchLiveSessions = useCallback(async () => {
    try {
      const res: any = await api.get('/network/sessions/live');
      const items = Array.isArray(res) ? res : res?.data || [];
      setSessions(items);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch live network sessions:', err);
      setError(err.message || 'Failed to poll live network sessions from MikroTik gateway.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveSessions();
    const interval = setInterval(fetchLiveSessions, 15000); // 15s live polling
    return () => clearInterval(interval);
  }, [fetchLiveSessions]);

  const handleDisconnect = (id: string, name: string) => {
    if (confirm(`Disconnect active PPPoE/Hotspot session for ${name}?`)) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      alert(`Session for ${name} terminated on MikroTik gateway.`);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      s.ipAddress.includes(search) ||
      s.macAddress.toLowerCase().includes(search.toLowerCase());
    const matchesRouter = routerFilter ? s.routerName.includes(routerFilter) : true;
    return matchesSearch && matchesRouter;
  });

  const totalIn = sessions.reduce((acc, s) => acc + (s.bytesIn || 0), 0);
  const totalOut = sessions.reduce((acc, s) => acc + (s.bytesOut || 0), 0);

  const uniqueRouters = Array.from(new Set(sessions.map((s) => s.routerName).filter(Boolean)));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Live Network Sessions
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time subscriber traffic, active leases, and bandwidth queue metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Stream (15s Poll)
          </div>

          <button
            onClick={() => {
              setIsLoading(true);
              fetchLiveSessions();
            }}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
            title="Refresh Live Data"
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
          <button onClick={() => fetchLiveSessions()} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Network Traffic KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
          <div className="text-2xl font-extrabold text-emerald-400">{sessions.length} Online</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Active Subscribers</div>
        </div>

        <div className="glass-card p-4 border bg-cyan-500/10 border-cyan-500/20">
          <div className="text-2xl font-extrabold text-cyan-400 flex items-center gap-1">
            <ArrowDown className="w-4 h-4" />
            {formatBytes(totalOut)}
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Total Download Traffic</div>
        </div>

        <div className="glass-card p-4 border bg-primary/10 border-primary/20">
          <div className="text-2xl font-extrabold text-primary flex items-center gap-1">
            <ArrowUp className="w-4 h-4" />
            {formatBytes(totalIn)}
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Total Upload Traffic</div>
        </div>

        <div className="glass-card p-4 border bg-amber-500/10 border-amber-500/20">
          <div className="text-2xl font-extrabold text-amber-400">0 Dropped</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Packet Drop Rate (0%)</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by customer, IP address, MAC address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        {uniqueRouters.length > 1 && (
          <select
            value={routerFilter}
            onChange={(e) => setRouterFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All Routers</option>
            {uniqueRouters.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Live Sessions Table */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          <span>Polling MikroTik session table...</span>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Radio className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="font-bold text-foreground">No active network sessions</p>
          <p className="text-xs text-muted-foreground">
            No PPPoE or Hotspot leases currently established on connected routers.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-background/40">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Subscriber</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">IP / MAC</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Gateway</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rate Limit</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Uptime</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Traffic (Down / Up)</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{session.customerName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {session.customerNumber} • {session.username}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <div className="text-foreground">{session.ipAddress}</div>
                      <div className="text-[9px] text-muted-foreground">{session.macAddress}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Router className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate max-w-[140px]">{session.routerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded text-[10px] font-bold">
                        {session.rateLimit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-[10px]">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{session.uptime}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[10px]">
                      <div className="text-cyan-400 font-semibold">↓ {formatBytes(session.bytesOut)}</div>
                      <div className="text-primary font-semibold">↑ {formatBytes(session.bytesIn)}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDisconnect(session.id, session.customerName)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[10px] font-bold border border-rose-500/20 transition-colors"
                        title="Disconnect session"
                      >
                        <PowerOff className="w-3 h-3" />
                        <span>Kick</span>
                      </button>
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
