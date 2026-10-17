'use client';

// ============================================
// Net-On — Customer Portal: My Profile
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Shield,
  Save,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function PortalProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/portal/profile');
      setProfile(res?.data || res);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.message || 'Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long');
      return;
    }

    setIsChangingPass(true);
    setPassError(null);
    setPassSuccess(null);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setPassSuccess('Password changed successfully! Next login will require your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Failed to change password');
    } finally {
      setIsChangingPass(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        <div className="text-xs text-muted-foreground">Loading account profile...</div>
      </div>
    );
  }

  const cust = profile?.customer;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          My Profile & Security
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Personal contact information, connection credentials, and password management.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <h2 className="text-sm font-bold text-foreground">Subscriber Information</h2>
          <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            {cust?.customerNumber}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Full Name</span>
            <div className="p-2.5 rounded-lg bg-background/50 border border-border/40 font-semibold text-foreground">
              {cust?.firstName} {cust?.lastName}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Phone Number</span>
            <div className="p-2.5 rounded-lg bg-background/50 border border-border/40 font-mono text-foreground">
              {cust?.phone}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Email Address</span>
            <div className="p-2.5 rounded-lg bg-background/50 border border-border/40 text-foreground">
              {profile?.email}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Physical Location</span>
            <div className="p-2.5 rounded-lg bg-background/50 border border-border/40 text-foreground">
              {cust?.location || cust?.address || 'Nairobi'}
            </div>
          </div>
        </div>

        {cust?.networkAccount && (
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs flex items-center justify-between text-cyan-300 mt-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>PPPoE / Router Username:</span>
            </div>
            <span className="font-mono font-bold text-foreground bg-background/60 px-2 py-0.5 rounded">
              {cust.networkAccount.username}
            </span>
          </div>
        )}
      </div>

      {/* Security & Password Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/40">
          <Lock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Change Password</h2>
        </div>

        {passSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passSuccess}</span>
          </div>
        )}

        {passError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPass || !currentPassword || !newPassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
              {isChangingPass ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
