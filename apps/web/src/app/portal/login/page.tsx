'use client';

// ============================================
// Net-On — Customer Portal Login Page
// ============================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      const loginData = data.data || data;
      const accessToken = loginData.tokens?.accessToken;
      const refreshToken = loginData.tokens?.refreshToken;
      const user = loginData.user;

      if (!accessToken) throw new Error('No access token received');

      localStorage.setItem('neton_access_token', accessToken);
      if (refreshToken) localStorage.setItem('neton_refresh_token', refreshToken);

      // Set cookie for middleware
      document.cookie = `neton_token=${accessToken}; path=/; max-age=${loginData.tokens?.expiresIn || 900}; SameSite=Lax`;

      // Route based on role
      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'FINANCE' || user?.role === 'TECHNICIAN' || user?.role === 'SUPPORT') {
        router.push('/admin');
      } else {
        router.push('/portal');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 glow-primary">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="gradient-text">Net-On</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Customer Self-Service Portal</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">Welcome Back</h2>
            <p className="text-xs text-muted-foreground mt-1">Sign in to manage your internet subscription</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-muted-foreground">
            ISP admin?{' '}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Admin Login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-[11px] text-muted-foreground/60">
          © {new Date().getFullYear()} Net-On Kenya ISP • All rights reserved
        </div>
      </div>
    </div>
  );
}
