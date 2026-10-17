'use client';

// ============================================
// Net-On — Admin Reports & Analytics Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Activity,
  RefreshCw,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Loader2,
  PieChart,
  Target,
} from 'lucide-react';
import { api } from '@/lib/api-client';

type ReportTab = 'revenue' | 'subscribers' | 'collections' | 'network';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');
  const [revenueData, setRevenueData] = useState<any>(null);
  const [subscriberData, setSubscriberData] = useState<any>(null);
  const [collectionsData, setCollectionsData] = useState<any>(null);
  const [networkData, setNetworkData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (tab: ReportTab) => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/reports/${tab === 'subscribers' ? 'subscribers' : tab}`);
      switch (tab) {
        case 'revenue': setRevenueData(res); break;
        case 'subscribers': setSubscriberData(res); break;
        case 'collections': setCollectionsData(res); break;
        case 'network': setNetworkData(res); break;
      }
    } catch (err: any) {
      console.error(`Failed to fetch ${tab} report:`, err);
      setError(err.message || `Failed to load ${tab} report.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  const tabs: { id: ReportTab; label: string; icon: React.ElementType }[] = [
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'subscribers', label: 'Subscribers', icon: Users },
    { id: 'collections', label: 'Collections', icon: Target },
    { id: 'network', label: 'Network', icon: Activity },
  ];

  // Helper: simple bar chart renderer (CSS-based)
  const renderBarChart = (data: Array<{ label: string; value: number }>, color: string) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <div className="flex items-end gap-2 h-48 px-2">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-[9px] font-bold text-foreground">
              {item.value >= 1000 ? `${(item.value / 1000).toFixed(0)}k` : item.value}
            </div>
            <div
              className={`w-full rounded-t-md ${color} transition-all duration-500`}
              style={{ height: `${(item.value / max) * 100}%`, minHeight: item.value > 0 ? '4px' : '0px' }}
            />
            <div className="text-[9px] text-muted-foreground font-medium truncate w-full text-center">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Reports & Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Revenue trends, subscriber analytics, collection efficiency, and network reports.
          </p>
        </div>
        <button
          onClick={() => fetchReport(activeTab)}
          disabled={isLoading}
          className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchReport(activeTab)} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-card/60 border border-border/40 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          Loading report data...
        </div>
      ) : (
        <>
          {/* Revenue Report */}
          {activeTab === 'revenue' && revenueData && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
                  <div className="text-lg font-extrabold text-emerald-400">
                    KSh {(revenueData.summary?.totalRevenue || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Total Revenue</div>
                </div>
                <div className="glass-card p-4 border bg-primary/10 border-primary/20">
                  <div className="text-lg font-extrabold text-primary">
                    KSh {(revenueData.summary?.currentMonthRevenue || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">This Month</div>
                </div>
                <div className="glass-card p-4 border bg-cyan-500/10 border-cyan-500/20">
                  <div className="text-lg font-extrabold text-cyan-400">
                    KSh {(revenueData.summary?.averageMonthlyRevenue || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Monthly Average</div>
                </div>
                <div className="glass-card p-4 border bg-amber-500/10 border-amber-500/20">
                  <div className="text-lg font-extrabold flex items-center gap-1">
                    {(revenueData.summary?.growthPercentage || 0) >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-rose-400" />
                    )}
                    <span className={revenueData.summary?.growthPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {revenueData.summary?.growthPercentage || 0}%
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">MoM Growth</div>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Monthly Revenue Trend
                </h3>
                {renderBarChart(
                  (revenueData.monthlyRevenue || []).map((m: any) => ({
                    label: m.month,
                    value: m.revenue,
                  })),
                  'bg-primary/60'
                )}
              </div>

              {/* Revenue by Provider + Package */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-card p-5">
                  <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" /> By Payment Provider
                  </h3>
                  <div className="space-y-3">
                    {(revenueData.byProvider || []).map((p: any, i: number) => {
                      const total = revenueData.summary?.totalRevenue || 1;
                      const pct = ((p.revenue / total) * 100).toFixed(1);
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-foreground">{p.provider}</span>
                            <span className="text-xs text-muted-foreground">
                              KSh {p.revenue.toLocaleString()} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500/60 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {(!revenueData.byProvider || revenueData.byProvider.length === 0) && (
                      <p className="text-xs text-muted-foreground">No provider data available.</p>
                    )}
                  </div>
                </div>

                <div className="glass-card p-5">
                  <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-cyan-400" /> By Internet Package
                  </h3>
                  <div className="space-y-3">
                    {(revenueData.byPackage || []).map((p: any, i: number) => {
                      const total = revenueData.summary?.totalRevenue || 1;
                      const pct = ((p.revenue / total) * 100).toFixed(1);
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-foreground">{p.packageName}</span>
                            <span className="text-xs text-muted-foreground">
                              KSh {p.revenue.toLocaleString()} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500/60 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {(!revenueData.byPackage || revenueData.byPackage.length === 0) && (
                      <p className="text-xs text-muted-foreground">No package data available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscriber Report */}
          {activeTab === 'subscribers' && subscriberData && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4 border bg-primary/10 border-primary/20">
                  <div className="text-lg font-extrabold text-primary">
                    {subscriberData.summary?.totalCustomers || 0}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Total Customers</div>
                </div>
                <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
                  <div className="text-lg font-extrabold text-emerald-400">
                    {subscriberData.summary?.activeSubscriptions || 0}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Active Subs</div>
                </div>
                <div className="glass-card p-4 border bg-amber-500/10 border-amber-500/20">
                  <div className="text-lg font-extrabold text-amber-400">
                    {subscriberData.summary?.retentionRate || 0}%
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Retention Rate</div>
                </div>
                <div className="glass-card p-4 border bg-rose-500/10 border-rose-500/20">
                  <div className="text-lg font-extrabold text-rose-400">
                    {subscriberData.summary?.churnRate || 0}%
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Churn Rate</div>
                </div>
              </div>

              {/* Subscriber Growth Chart */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Subscriber Growth
                </h3>
                {renderBarChart(
                  (subscriberData.timeline || []).map((m: any) => ({
                    label: m.month,
                    value: m.totalCustomers,
                  })),
                  'bg-primary/60'
                )}
              </div>

              {/* Package Distribution */}
              <div className="glass-card p-5">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-cyan-400" /> Active Subscriptions by Package
                </h3>
                <div className="space-y-3">
                  {(subscriberData.packageDistribution || []).map((p: any, i: number) => {
                    const total = subscriberData.summary?.activeSubscriptions || 1;
                    const pct = ((p.activeCount / total) * 100).toFixed(1);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-foreground">
                            {p.packageName}
                            <span className="text-muted-foreground ml-2">KSh {p.price.toLocaleString()}/mo</span>
                          </span>
                          <span className="text-xs text-muted-foreground font-bold">
                            {p.activeCount} subs ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/60 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(!subscriberData.packageDistribution || subscriberData.packageDistribution.length === 0) && (
                    <p className="text-xs text-muted-foreground">No package distribution data.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Collections Report */}
          {activeTab === 'collections' && collectionsData && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
                  <div className="text-lg font-extrabold text-emerald-400">
                    {collectionsData.summary?.overallCollectionEfficiency || 0}%
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Collection Efficiency</div>
                </div>
                <div className="glass-card p-4 border bg-primary/10 border-primary/20">
                  <div className="text-lg font-extrabold text-primary">
                    KSh {(collectionsData.summary?.totalCollected || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Total Collected</div>
                </div>
                <div className="glass-card p-4 border bg-amber-500/10 border-amber-500/20">
                  <div className="text-lg font-extrabold text-amber-400">
                    KSh {(collectionsData.summary?.totalOutstanding || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Outstanding</div>
                </div>
                <div className="glass-card p-4 border bg-rose-500/10 border-rose-500/20">
                  <div className="text-lg font-extrabold text-rose-400">
                    KSh {(collectionsData.summary?.overdueAmount || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                    Overdue ({collectionsData.summary?.overdueCount || 0})
                  </div>
                </div>
              </div>

              {/* Collections Timeline */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" /> Invoice vs Collection (6 Months)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Month</th>
                        <th className="text-right px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Invoiced</th>
                        <th className="text-right px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Collected</th>
                        <th className="text-right px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Rate</th>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase" style={{ minWidth: 120 }}>Efficiency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {(collectionsData.collectionTimeline || []).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-accent/30 transition-colors">
                          <td className="px-3 py-2.5 font-semibold text-foreground">{row.label}</td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">
                            KSh {row.invoicedAmount.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-400">
                            KSh {row.collectedAmount.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`font-bold ${row.collectionRate >= 80 ? 'text-emerald-400' : row.collectionRate >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {row.collectionRate}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${row.collectionRate >= 80 ? 'bg-emerald-500/60' : row.collectionRate >= 50 ? 'bg-amber-500/60' : 'bg-rose-500/60'}`}
                                style={{ width: `${Math.min(row.collectionRate, 100)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Network Report */}
          {activeTab === 'network' && networkData && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4 border bg-primary/10 border-primary/20">
                  <div className="text-lg font-extrabold text-primary">
                    {networkData.summary?.totalRouters || 0}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Total Routers</div>
                </div>
                <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
                  <div className="text-lg font-extrabold text-emerald-400">
                    {networkData.summary?.onlineRouters || 0}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Online</div>
                </div>
                <div className="glass-card p-4 border bg-cyan-500/10 border-cyan-500/20">
                  <div className="text-lg font-extrabold text-cyan-400">
                    {networkData.summary?.activeAccounts || 0}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Active Accounts</div>
                </div>
                <div className="glass-card p-4 border bg-amber-500/10 border-amber-500/20">
                  <div className="text-lg font-extrabold text-amber-400">
                    {networkData.summary?.totalSessions || 0}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Total Sessions</div>
                </div>
              </div>

              {/* Router Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(networkData.routers || []).map((router: any) => (
                  <div key={router.id} className="glass-card p-5 hover:border-primary/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm text-foreground">{router.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                        router.status === 'ONLINE'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      }`}>
                        {router.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">IP:</span>{' '}
                        <span className="font-mono text-foreground">{router.ip}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span>{' '}
                        <span className="text-foreground">{router.location || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Accounts:</span>{' '}
                        <span className="font-bold text-primary">{router.accountCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pending Sync:</span>{' '}
                        <span className="font-bold text-amber-400">{router.pendingSyncJobs}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Account Status Breakdown */}
              <div className="glass-card p-5">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Network Accounts by Status
                </h3>
                <div className="flex flex-wrap gap-4">
                  {(networkData.accountsByStatus || []).map((g: any, i: number) => {
                    const colors: Record<string, string> = {
                      ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                      DISABLED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                      SYNCED: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                    };
                    return (
                      <div key={i} className={`px-4 py-3 rounded-xl border ${colors[g.status] || 'text-muted-foreground bg-card/60 border-border/40'}`}>
                        <div className="text-xl font-extrabold">{g.count}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider">{g.status}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
