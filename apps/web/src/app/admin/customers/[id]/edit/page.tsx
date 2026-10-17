'use client';

// ============================================
// Net-On — Admin: Edit Customer Profile
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [customerNumber, setCustomerNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  const [installationAddress, setInstallationAddress] = useState('');
  const [notes, setNotes] = useState('');

  const fetchCustomer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/customers/${id}`);
      const cust = res?.data || res;
      if (cust) {
        setCustomerNumber(cust.customerNumber || '');
        setFirstName(cust.firstName || '');
        setLastName(cust.lastName || '');
        setPhone(cust.phone || '');
        setEmail(cust.email || '');
        setAddress(cust.address || '');
        setLocation(cust.location || '');
        setInstallationAddress(cust.installationAddress || '');
        setNotes(cust.notes || '');
      }
    } catch (err: any) {
      console.error('Failed to load customer:', err);
      setError(err.message || 'Customer profile not found');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id, fetchCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) {
      setError('Please provide first name, last name, and phone number');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await api.patch(`/customers/${id}`, {
        firstName,
        lastName,
        phone,
        email: email || undefined,
        address: address || undefined,
        location: location || undefined,
        installationAddress: installationAddress || undefined,
        notes: notes || undefined,
      });

      router.push(`/admin/customers/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update customer profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
        <span className="text-xs text-muted-foreground">Loading customer details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/customers/${id}`}
          className="p-2 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Edit Customer Profile
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Updating record for <span className="font-mono font-bold text-primary">{customerNumber}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                Phone Number (M-Pesa)
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="254712345678"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-foreground">Location & Installation</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                Neighborhood / Region
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Westlands, Kilimani, Karen"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                Postal / Billing Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. P.O. Box 1234, Nairobi"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                Physical Installation Address / Apartment Details
              </label>
              <input
                type="text"
                value={installationAddress}
                onChange={(e) => setInstallationAddress(e.target.value)}
                placeholder="e.g. Rosewood Court, Apt 4B, Wood Avenue"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                Technician Notes / Fiber Route
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for field technicians..."
                className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/admin/customers/${id}`}
            className="px-4 py-2.5 rounded-lg bg-accent/50 text-muted-foreground hover:text-foreground text-xs font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
