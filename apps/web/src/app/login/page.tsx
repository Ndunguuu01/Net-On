'use client';

// ============================================
// Net-On — Interactive Client Login Page
// ============================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Loader2, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@neton.co.ke');
  const [password, setPassword] = useState('ChangeThisPassword123!');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Invalid email or password. Please check your credentials.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid">
      {/* Ambient Glow Elements */}
      <div className="absolute top-1/3 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-6 my-8">
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 glow-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-8 h-8 text-primary"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text">Net-On</h1>
          <p className="text-xs text-muted-foreground mt-1">
            ISP Billing & Network Management Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 shadow-2xl relative">
          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Authentication Error</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="admin@neton.co.ke"
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-4 pr-11 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full px-4 py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Admin Console</span>
                </>
              )}
            </button>
          </form>

          {/* Preset Helper */}
          <div className="mt-6 pt-4 border-t border-border/40 text-center">
            <div className="text-[11px] text-muted-foreground/70">
              Default Seed Super Admin Credentials:
            </div>
            <div className="text-xs font-mono text-primary font-semibold mt-1">
              admin@neton.co.ke
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
          Net-On ISP Platform • Version 1.0.0
        </p>
      </div>
    </div>
  );
}
