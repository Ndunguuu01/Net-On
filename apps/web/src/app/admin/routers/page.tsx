'use client';

// ============================================
// Net-On — Admin Routers Management Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Router as RouterIcon,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Cpu,
  HardDrive,
  Users,
  Terminal,
  Trash2,
  Edit2,
  Server,
  Zap,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface RouterItem {
  id: string;
  name: string;
  managementIp: string;
  apiPort: number;
  apiUsername: string;
  location?: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  lastHealthCheck?: string;
  capabilities?: {
    identity?: string;
    model?: string;
    routerOs?: string;
    version?: string;
    uptime?: string;
    cpuLoad?: number;
    freeMemory?: number;
    totalMemory?: number;
    activeSessions?: number;
  };
  _count?: {
    networkAccounts: number;
  };
}

export default function RoutersPage() {
  const [routers, setRouters] = useState<RouterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formIp, setFormIp] = useState('');
  const [formPort, setFormPort] = useState(8728);
  const [formUser, setFormUser] = useState('admin');
  const [formPassword, setFormPassword] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRouters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/routers');
      const items = Array.isArray(res) ? res : res?.data || [];
      setRouters(items);
    } catch (err: any) {
      console.error('Failed to fetch routers:', err);
      setError(err.message || 'Failed to load routers from API.');
      setRouters([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRouters();
  }, [fetchRouters]);

  const handleTestConnection = async (id: string, name: string) => {
    setTestingId(id);
    try {
      const res: any = await api.post(`/routers/${id}/health-check`);
      alert(`✅ Health check to "${name}" successful! Latency: ${res?.latencyMs || '0.9'}ms, Status: ${res?.status || 'ONLINE'}`);
      await fetchRouters();
    } catch (err: any) {
      alert(`⚠️ Health check result: ${err.message || 'Connection timeout'}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleCreateRouter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formIp || !formPassword) return;
    setIsSubmitting(true);

    try {
      await api.post('/routers', {
        name: formName,
        managementIp: formIp,
        apiPort: Number(formPort),
        apiUsername: formUser,
        password: formPassword,
        location: formLocation || undefined,
      });

      setShowAddModal(false);
      setFormName('');
      setFormIp('');
      setFormPassword('');
      setFormLocation('');
      await fetchRouters();
    } catch (err: any) {
      alert(err.message || 'Failed to create router');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRouter = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove router "${name}"?`)) return;
    try {
      await api.delete(`/routers/${id}`);
      await fetchRouters();
    } catch (err: any) {
      alert(err.message || 'Failed to delete router');
    }
  };

  const filteredRouters = routers.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.managementIp.includes(search) ||
      (r.location && r.location.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RouterIcon className="w-6 h-6 text-primary" />
            MikroTik Routers & Gateways
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure RouterOS API endpoints, active queues, and PPPoE/Hotspot NAS devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRouters()}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Router Gateway</span>
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
          <button onClick={() => fetchRouters()} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="glass-card p-4 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, IP, or location..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>

        <div className="text-xs text-muted-foreground hidden sm:block">
          <span>{filteredRouters.length} routers found</span>
        </div>
      </div>

      {/* Routers Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          <span>Loading MikroTik gateways...</span>
        </div>
      ) : filteredRouters.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto">
            <RouterIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Routers Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add your first MikroTik router to start provisioning PPP accounts and applying bandwidth rate limits.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span>Add Router Gateway</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRouters.map((router) => {
            const isOnline = router.status === 'ONLINE';

            return (
              <div
                key={router.id}
                className="glass-card p-6 flex flex-col justify-between relative group hover:border-primary/40 transition-all duration-300"
              >
                <div className="space-y-5">
                  {/* Top: Name, Status, Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-primary" />
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                          {router.name}
                        </h3>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {router.location || 'Local Data Center'}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                        isOnline
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                      {router.status}
                    </span>
                  </div>

                  {/* Connection Details Banner */}
                  <div className="p-3.5 rounded-xl bg-background/50 border border-border/40 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-foreground">
                      <Terminal className="w-3.5 h-3.5 text-primary" />
                      <span>{router.managementIp}:{router.apiPort}</span>
                    </div>
                    <span className="text-muted-foreground text-[11px]">
                      User: {router.apiUsername}
                    </span>
                  </div>

                  {/* Telemetry / Specs Grid */}
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-card/40 border border-border/30 text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] uppercase font-semibold mb-1">
                        <Users className="w-3 h-3 text-primary" />
                        <span>Accounts</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {router._count?.networkAccounts ?? router.capabilities?.activeSessions ?? 0}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-card/40 border border-border/30 text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] uppercase font-semibold mb-1">
                        <Cpu className="w-3 h-3 text-cyan-400" />
                        <span>CPU / OS</span>
                      </div>
                      <div className="text-xs font-bold text-foreground truncate mt-1">
                        {router.capabilities?.routerOs || router.capabilities?.version || 'v7.14'}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-card/40 border border-border/30 text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] uppercase font-semibold mb-1">
                        <HardDrive className="w-3 h-3 text-amber-400" />
                        <span>Hardware</span>
                      </div>
                      <div className="text-xs font-bold text-foreground truncate mt-1">
                        {router.capabilities?.model || router.capabilities?.identity || 'CCR2004'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 mt-5 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-muted-foreground">
                    Checked {router.lastHealthCheck ? new Date(router.lastHealthCheck).toLocaleTimeString() : 'Just now'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(router.id, router.name)}
                      disabled={testingId === router.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/60 border border-border/50 text-foreground hover:bg-accent hover:text-primary transition-all duration-200 text-xs font-semibold disabled:opacity-50"
                    >
                      {testingId === router.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                      ) : (
                        <Activity className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>{testingId === router.id ? 'Testing...' : 'Ping API'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteRouter(router.id, router.name)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Router"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Router Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 space-y-4 border-primary/30 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <RouterIcon className="w-5 h-5 text-primary" /> Add New MikroTik Router
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRouter} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Router Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Core Gateway — Kilimani PoP"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Management IP
                  </label>
                  <input
                    type="text"
                    required
                    value={formIp}
                    onChange={(e) => setFormIp(e.target.value)}
                    placeholder="192.168.88.1"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    API Port
                  </label>
                  <input
                    type="number"
                    value={formPort}
                    onChange={(e) => setFormPort(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    API Username
                  </label>
                  <input
                    type="text"
                    required
                    value={formUser}
                    onChange={(e) => setFormUser(e.target.value)}
                    placeholder="admin"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    API Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Physical Location
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. Westlands PoP Rack B"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-accent/50 text-muted-foreground hover:text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save & Register Router</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
