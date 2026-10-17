'use client';

// ============================================
// Net-On — Customer Portal: Support Helpdesk
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Send,
  Loader2,
  Tag,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'RESOLVED' | 'CLOSED' | string;
  createdAt: string;
}

const statusBadges: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  WAITING_ON_CUSTOMER: { label: 'Waiting on You', color: 'bg-primary/10 text-primary border-primary/20' },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  CLOSED: { label: 'Closed', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

export default function PortalSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New ticket modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('SLOW_SPEEDS');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/portal/support');
      const items = Array.isArray(res) ? res : res?.data || [];
      setTickets(items);
    } catch (err: any) {
      console.error('Failed to load tickets:', err);
      setError(err.message || 'Failed to load tickets.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setIsSubmitting(true);

    try {
      await api.post('/portal/support', {
        subject,
        description,
        category,
        priority,
      });

      setShowNewModal(false);
      setSubject('');
      setDescription('');
      await fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to submit support ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            Support & Technical Help
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Open assistance tickets with Net-On Network Operations Center (NOC).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Open New Ticket</span>
          </button>

          <button
            onClick={fetchTickets}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <div className="text-xs text-muted-foreground">Loading support history...</div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <HelpCircle className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-foreground">No Support Tickets</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Everything looking smooth! If you ever face connection cuts or speed drops, submit a ticket here.
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span>Open a Ticket</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const badge = statusBadges[ticket.status] || statusBadges.OPEN;

            return (
              <div
                key={ticket.id}
                className="glass-card p-5 hover:border-primary/40 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{ticket.ticketNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-card/60 px-2 py-0.5 rounded border border-border/40 font-mono">
                        {ticket.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-foreground">{ticket.subject}</h3>
                    <p className="text-xs text-muted-foreground">{ticket.description}</p>
                  </div>

                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(ticket.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 space-y-4 border-primary/30 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Submit Support Request
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Issue Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="SLOW_SPEEDS">Slow Internet Speeds / High Latency</option>
                  <option value="FIBER_CUT">No Internet / Optical LOS Red Light</option>
                  <option value="PACKAGE_CHANGE">Package Upgrade / Tariff Change</option>
                  <option value="BILLING">Billing & Invoice Inquiry</option>
                  <option value="ROUTER_CONFIG">Wi-Fi Password / Router Relocation</option>
                  <option value="GENERAL">General Support</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Subject / Summary
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. LOS light blinking red since morning"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you are experiencing. Mention if you have tried rebooting your ONU router..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg bg-accent/50 text-muted-foreground hover:text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Ticket</span>
                    </>
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
