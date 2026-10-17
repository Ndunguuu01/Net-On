'use client';

// ============================================
// Net-On — Admin Support Tickets Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  User,
  Tag,
  Check,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT' | string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'RESOLVED' | 'CLOSED' | string;
  createdAt: string;
  customer?: {
    id: string;
    customerNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

const priorityBadges: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  MEDIUM: { label: 'Medium', color: 'bg-primary/10 text-primary border-primary/20' },
  HIGH: { label: 'High', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  CRITICAL: { label: 'Critical', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  URGENT: { label: 'Urgent', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

const statusBadges: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  CLOSED: { label: 'Closed', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  WAITING_ON_CUSTOMER: { label: 'Waiting', color: 'bg-primary/10 text-primary border-primary/20' },
};

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/support');
      const items = res?.items || res?.data?.items || (Array.isArray(res) ? res : []);
      setTickets(items);
    } catch (err: any) {
      console.error('Failed to fetch support tickets:', err);
      setError(err.message || 'Failed to load support tickets.');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleResolve = async (id: string, ticketNum: string) => {
    try {
      await api.post(`/support/${id}/resolve`);
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'RESOLVED' as const } : t))
      );
      alert(`Ticket ${ticketNum} marked as Resolved.`);
    } catch (err: any) {
      alert(err.message || 'Failed to resolve ticket');
    }
  };

  const filtered = tickets.filter((t) => {
    const cust = t.customer || { firstName: '', lastName: '', customerNumber: '' };
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      cust.firstName.toLowerCase().includes(search.toLowerCase()) ||
      cust.lastName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            Support Helpdesk
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Customer inquiries, technical tickets, and field technician dispatch queue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTickets()}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
            title="Refresh"
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
          <button onClick={() => fetchTickets()} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 border bg-amber-500/10 border-amber-500/20">
          <div className="text-2xl font-extrabold text-amber-400">
            {tickets.filter((t) => t.status === 'OPEN').length} Open
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Unassigned Tickets</div>
        </div>
        <div className="glass-card p-4 border bg-cyan-500/10 border-cyan-500/20">
          <div className="text-2xl font-extrabold text-cyan-400">
            {tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'WAITING_ON_CUSTOMER').length} In Progress
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Technician Working</div>
        </div>
        <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
          <div className="text-2xl font-extrabold text-emerald-400">
            {tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length} Resolved
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Closed / Resolved</div>
        </div>
        <div className="glass-card p-4 border bg-primary/10 border-primary/20">
          <div className="text-2xl font-extrabold text-primary">{tickets.length} Total</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">All Recorded Tickets</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets by subject, #, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          Loading tickets...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <HelpCircle className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="font-bold text-foreground">No support tickets found</p>
          <p className="text-xs text-muted-foreground">
            No customer support requests match your search criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const pBadge = priorityBadges[ticket.priority] || priorityBadges.MEDIUM;
            const sBadge = statusBadges[ticket.status] || statusBadges.OPEN;

            return (
              <div
                key={ticket.id}
                className="glass-card p-5 hover:border-primary/40 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-primary">{ticket.ticketNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${sBadge.color}`}>
                      {sBadge.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${pBadge.color}`}>
                      {pBadge.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono bg-card/60 px-2 py-0.5 rounded border border-border/40">
                      {ticket.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    {ticket.subject}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                    {ticket.customer ? (
                      <>
                        <span className="font-medium text-foreground">
                          {ticket.customer.firstName} {ticket.customer.lastName} ({ticket.customer.customerNumber})
                        </span>
                        <span>•</span>
                        <span>{ticket.customer.phone}</span>
                        <span>•</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-foreground">Anonymous / Portal</span>
                        <span>•</span>
                      </>
                    )}
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleResolve(ticket.id, ticket.ticketNumber)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
