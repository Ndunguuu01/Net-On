'use client';

// ============================================
// Net-On — Forgot Password Page
// ============================================

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to process request');
      }

      setIsSubmitted(true);
      if (data.resetToken || data.data?.resetToken) {
        setDemoToken(data.resetToken || data.data?.resetToken);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient Glow Elements */}
      <div className="absolute top-1/3 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-6 my-8">
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 glow-primary">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text">Net-On</h1>
          <p className="text-xs text-muted-foreground mt-1">Account Recovery</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 shadow-2xl relative space-y-6">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Recovery Link Dispatched</h2>
              <p className="text-xs text-muted-foreground">
                If an account exists for <span className="font-semibold text-foreground">{email}</span>, you will receive password reset instructions.
              </p>

              {demoToken && (
                <div className="p-3 rounded-lg bg-card/60 border border-border text-left space-y-2">
                  <div className="text-[10px] uppercase font-bold text-primary">Direct Reset Link:</div>
                  <Link
                    href={`/reset-password?token=${demoToken}`}
                    className="text-xs text-cyan-400 hover:underline break-all font-mono block"
                  >
                    Click here to reset your password →
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-bold text-foreground">Forgot Password</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your registered email address to receive a secure password recovery link.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@neton.co.ke"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
