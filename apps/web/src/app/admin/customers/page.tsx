'use client';

// ============================================
// Net-On — Admin Customers List Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Archive,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface CustomerItem {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  location?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'PENDING' | 'ARCHIVED';
  createdAt: string;
  subscriptions?: Array<{
    package?: {
      name: string;
      price: number;
    };
  }>;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res: any = await api.get('/customers', params);
      const items = res?.items || res?.data?.items || (Array.isArray(res) ? res : []);
      const pages = res?.meta?.totalPages || res?.data?.meta?.totalPages || 1;
      const count = res?.meta?.total ?? res?.data?.meta?.total ?? items.length;

      setCustomers(items);
      setTotalPages(pages);
      setTotalCount(count);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
      setError(err.message || 'Failed to load customers from API.');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-bold">
            <AlertTriangle className="w-3 h-3" /> Suspended
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold">
            <Clock className="w-3 h-3" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/50 text-muted-foreground border border-border/40 text-[11px] font-bold">
            <Archive className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Customer Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage internet subscribers, contact information, and account status.
          </p>
        </div>

        <Link
          href="/admin/customers/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchCustomers()} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, NET-xxxx..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </form>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'ARCHIVED'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-card/40 text-muted-foreground hover:text-foreground hover:bg-accent/40 border border-border/30'
              }`}
            >
              {tab === 'ALL' ? `All (${totalCount})` : tab}
            </button>
          ))}

          <button
            onClick={() => fetchCustomers()}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-card/40 text-muted-foreground hover:text-foreground hover:bg-accent/40 border border-border/30 transition-colors ml-1 disabled:opacity-50"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-card/40 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Phone / Contact</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Active Package</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span>Loading customer list...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-semibold text-foreground">No customers found</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      Try searching with different terms or add a new customer.
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-accent/30 transition-colors group"
                  >
                    {/* Name & Customer Number */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="font-bold text-foreground hover:text-primary transition-colors block"
                      >
                        {c.firstName} {c.lastName}
                      </Link>
                      <span className="text-[10px] font-mono text-primary font-semibold">
                        {c.customerNumber}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-foreground font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span>{c.phone}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] truncate max-w-[180px]">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                        <span>{c.location || 'Nairobi'}</span>
                      </div>
                    </td>

                    {/* Active Package */}
                    <td className="px-6 py-4">
                      {c.subscriptions?.[0]?.package ? (
                        <div>
                          <span className="font-semibold text-foreground">
                            {c.subscriptions[0].package.name}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            KSh {Number(c.subscriptions[0].package.price).toLocaleString()} / mo
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-[11px] italic">
                          No active package
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">{getStatusBadge(c.status)}</td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-card/60 border border-border/50 text-xs font-semibold text-foreground hover:bg-accent hover:text-primary transition-all duration-200"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-3 border-t border-border/40 bg-card/20 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Showing <span className="font-semibold text-foreground">{customers.length}</span> of{' '}
            <span className="font-semibold text-foreground">{totalCount}</span> subscribers
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg bg-card border border-border/50 text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg bg-card border border-border/50 text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
