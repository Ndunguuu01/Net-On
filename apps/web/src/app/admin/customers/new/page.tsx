'use client';

// ============================================
// Net-On — Add Customer Page
// ============================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function NewCustomerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    installationAddress: '',
    location: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res: any = await api.post('/customers', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address || undefined,
        installationAddress: formData.installationAddress || undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined,
      });

      setSuccessMessage(
        `Customer ${res.customerNumber || ''} (${formData.firstName} ${formData.lastName}) created successfully!`,
      );

      setTimeout(() => {
        router.push('/admin/customers');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to create customer. Please check the information provided.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/customers"
          className="p-2 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Add New Subscriber
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register a new customer profile. System auto-assigns a sequential NET-xxxxxx number.
          </p>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Submission Failed</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="glass-card p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Details */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Subscriber Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  First Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. John"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Last Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Kamau"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border/40" />

          {/* Section 2: Contact Info */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Phone Number (M-Pesa) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 0712345678 or 254712345678"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Used for M-Pesa billing & SMS notifications.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john.kamau@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border/40" />

          {/* Section 3: Installation & Location */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Installation & Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  General Location / Estate
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Westlands / Waiyaki Way"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Installation House / Plot Address
                </label>
                <input
                  type="text"
                  name="installationAddress"
                  value={formData.installationAddress}
                  onChange={handleChange}
                  placeholder="e.g. Plot 42, Apt 3B"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border/40" />

          {/* Section 4: Notes */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Internal Notes / Special Instructions
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Priority installation, requires custom router config..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
            <Link
              href="/admin/customers"
              className="px-4 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Customer...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Save Customer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
