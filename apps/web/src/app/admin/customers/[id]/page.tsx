'use client';

// ============================================
// Net-On — Customer Detail Profile View
// ============================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  PauseCircle,
  PlayCircle,
  Trash2,
  Repeat,
  FileText,
  CreditCard,
  Router,
  Clock,
  Loader2,
  Edit2,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payments' | 'network'>('overview');

  const [error, setError] = useState<string | null>(null);

  const fetchCustomerDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/customers/${id}`);
      setCustomer(res.data || res);
    } catch (err: any) {
      console.error('Failed to load customer:', err);
      setError(err.message || 'Failed to load customer profile');
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this customer?')) return;
    setIsActionLoading(true);
    try {
      await api.post(`/customers/${id}/suspend`, { reason: 'Manual suspension via admin UI' });
      await fetchCustomerDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to suspend customer');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setIsActionLoading(true);
    try {
      await api.post(`/customers/${id}/reactivate`);
      await fetchCustomerDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate customer');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this customer? User account will be deactivated.')) return;
    setIsActionLoading(true);
    try {
      await api.delete(`/customers/${id}`);
      router.push('/admin/customers');
    } catch (err: any) {
      alert(err.message || 'Failed to archive customer');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
          <span className="text-xs text-muted-foreground">Loading customer profile...</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-semibold text-foreground">Customer Not Found</p>
        <Link href="/admin/customers" className="text-xs text-primary hover:underline mt-2 inline-block">
          Return to customer list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="p-2 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {customer.firstName} {customer.lastName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold">
                {customer.customerNumber}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registered on {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {customer.status === 'ACTIVE' ? (
            <button
              onClick={handleSuspend}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/20 transition-all"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Suspend</span>
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Reactivate</span>
            </button>
          )}

          <Link
            href={`/admin/customers/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-card/60 text-foreground hover:bg-accent/50 border border-border/50 text-xs font-semibold transition-colors"
          >
            <Edit2 className="w-4 h-4 text-primary" />
            <span>Edit Profile</span>
          </Link>

          <button
            onClick={handleArchive}
            disabled={isActionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-card/60 text-muted-foreground hover:text-rose-400 border border-border/50 text-xs font-semibold hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Archive</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Profile Info & Related Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Details Card */}
        <div className="glass-card p-6 space-y-6">
          <div className="border-b border-border/40 pb-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Subscriber Identity
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Account Status</span>
                <span
                  className={`font-bold ${
                    customer.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {customer.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phone (M-Pesa)</span>
                <span className="font-mono font-semibold text-foreground">{customer.phone}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-semibold text-foreground truncate max-w-[160px]">
                  {customer.email || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-semibold text-foreground">{customer.location || 'Nairobi'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Installation Address
            </h3>
            <p className="text-xs text-muted-foreground">
              {customer.installationAddress || customer.address || 'No specific installation address recorded.'}
            </p>
          </div>

          {customer.notes && (
            <div className="pt-4 border-t border-border/40">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                Internal Notes
              </h3>
              <p className="text-xs text-muted-foreground/80 font-mono bg-background/40 p-2.5 rounded-lg border border-border/30 whitespace-pre-wrap">
                {customer.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Tabs (Overview, Subscriptions, Invoices, Payments, Network) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Selection */}
          <div className="glass-card p-1.5 flex items-center gap-2 border border-border/40">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'invoices'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              }`}
            >
              Invoices ({customer.invoices?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'payments'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              }`}
            >
              Payments ({customer.payments?.length || 0})
            </button>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Active Subscription Summary */}
              <div className="glass-card p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Current Subscription
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    Active
                  </span>
                </div>

                {customer.subscriptions && customer.subscriptions.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-lg text-foreground">
                      {customer.subscriptions[0].package?.name}
                    </div>
                    <div className="text-muted-foreground">
                      Price: KSh {customer.subscriptions[0].package?.price?.toLocaleString()} / month
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No active package subscription assigned yet.
                  </div>
                )}
              </div>

              {/* Network Credentials Summary */}
              <div className="glass-card p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Router className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      MikroTik Network Account
                    </h3>
                  </div>
                </div>

                {customer.networkAccount ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">PPP Username:</span>
                      <span className="font-mono font-bold text-foreground">{customer.networkAccount.username}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Assigned IP:</span>
                      <span className="font-mono text-cyan-400">{customer.networkAccount.ipAddress || 'Dynamic Pool'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No network account provisioned yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoices Tab Content */}
          {activeTab === 'invoices' && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                Billing Statements
              </h3>
              <div className="text-xs text-muted-foreground text-center py-6">
                No billing statements generated yet.
              </div>
            </div>
          )}

          {/* Payments Tab Content */}
          {activeTab === 'payments' && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                Payment History
              </h3>
              <div className="text-xs text-muted-foreground text-center py-6">
                No payment transactions recorded yet.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
