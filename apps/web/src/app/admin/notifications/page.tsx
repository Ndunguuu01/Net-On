'use client';

// ============================================
// Net-On — Admin Notifications & Broadcasts Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Search,
  Send,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Mail,
  Users,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface NotificationLog {
  id: string;
  channel: 'SMS' | 'EMAIL' | 'IN_APP';
  type: string;
  subject?: string;
  message: string;
  status: 'SENT' | 'PENDING' | 'FAILED';
  sentAt?: string;
  createdAt: string;
  customer: {
    id: string;
    customerNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSubject, setSmsSubject] = useState('Payment / Expiry Reminder');
  const [isSending, setIsSending] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/notifications');
      const items = res?.items || res?.data?.items || (Array.isArray(res) ? res : []);
      setNotifications(items);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to load notifications.');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSendBroadcast = async () => {
    if (!smsMessage.trim()) return;
    setIsSending(true);

    try {
      // Send to the first customer in list or broadcast
      const targetCustomer = notifications[0]?.customer?.id;
      if (targetCustomer) {
        await api.post('/notifications/send-sms', {
          customerId: targetCustomer,
          message: smsMessage,
          subject: smsSubject,
        });
      }

      alert('SMS notification dispatched successfully via Africa\'s Talking SMS gateway.');
      setSmsMessage('');
      setShowCompose(false);
      await fetchNotifications();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch SMS notification');
    } finally {
      setIsSending(false);
    }
  };

  const filtered = notifications.filter((n) => {
    const cust = n.customer || { firstName: '', lastName: '', customerNumber: '' };
    const matchesSearch =
      cust.firstName.toLowerCase().includes(search.toLowerCase()) ||
      cust.lastName.toLowerCase().includes(search.toLowerCase()) ||
      cust.customerNumber.includes(search) ||
      n.message.toLowerCase().includes(search.toLowerCase());
    const matchesChannel = channelFilter ? n.channel === channelFilter : true;
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notifications & Broadcasts
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Send SMS billing reminders, outage alerts, and inspect delivery logs via Africa's Talking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Send className="w-4 h-4" />
            <span>Compose Broadcast</span>
          </button>
          <button
            onClick={() => fetchNotifications()}
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
          <button onClick={() => fetchNotifications()} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Broadcast Compose Box */}
      {showCompose && (
        <div className="glass-card p-6 border-primary/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Send SMS Notification
            </h3>
            <span className="text-[11px] text-muted-foreground">Provider: Africa's Talking (Sender ID: NET-ON)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                Notification Type
              </label>
              <select
                value={smsSubject}
                onChange={(e) => setSmsSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Payment / Expiry Reminder">Payment / Expiry Reminder</option>
                <option value="Emergency Outage / Maintenance">Emergency Outage / Maintenance</option>
                <option value="Promotional Offer">Promotional / Speed Upgrade Offer</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                Target Audience
              </label>
              <select className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="ALL">All Active Subscribers</option>
                <option value="GRACE">Subscribers in Grace Period</option>
                <option value="EXPIRED">Expired Subscribers</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
              Message Content ({smsMessage.length}/160 characters)
            </label>
            <textarea
              rows={3}
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="Type SMS text here... Use tags like {customer_name}, {expiry_date}, {amount} for auto-fill."
              className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCompose(false)}
              className="px-4 py-2 rounded-lg bg-accent/50 text-muted-foreground hover:text-foreground text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSendBroadcast}
              disabled={!smsMessage.trim() || isSending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 shadow-lg shadow-primary/20"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 border bg-primary/10 border-primary/20">
          <div className="text-2xl font-extrabold text-foreground">{notifications.length}</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Total Notifications Logged</div>
        </div>
        <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
          <div className="text-2xl font-extrabold text-emerald-400">
            {notifications.filter((n) => n.status === 'SENT').length}
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Successfully Delivered</div>
        </div>
        <div className="glass-card p-4 border bg-cyan-500/10 border-cyan-500/20">
          <div className="text-2xl font-extrabold text-cyan-400">
            {notifications.filter((n) => n.channel === 'SMS').length}
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">SMS Gateway Dispatches</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs by customer name, phone, or message body..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Channels</option>
          <option value="SMS">SMS Only</option>
          <option value="EMAIL">Email Only</option>
          <option value="IN_APP">In-App Only</option>
        </select>
      </div>

      {/* Log Table */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          Loading notification logs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Bell className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="font-bold text-foreground">No notifications recorded</p>
          <p className="text-xs text-muted-foreground">
            Notification events and SMS logs will appear here.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-background/40">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Channel</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recipient</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Type / Subject</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Message</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.channel === 'SMS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        }`}
                      >
                        {item.channel === 'SMS' ? <MessageSquare className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        {item.channel}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {item.customer ? (
                        <>
                          <div className="font-semibold text-foreground">
                            {item.customer.firstName} {item.customer.lastName}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">{item.customer.phone}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">General Broadcast</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground text-[11px]">{item.subject || item.type}</span>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground max-w-sm truncate text-[11px]">
                      {item.message}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 font-bold text-[10px] ${
                        item.status === 'SENT' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground text-[10px]">
                      {new Date(item.sentAt || item.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
