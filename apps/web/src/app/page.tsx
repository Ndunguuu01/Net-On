'use client';

// ============================================
// Net-On — Modern ISP Operating System Landing Page
// ============================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  CreditCard,
  Activity,
  Users,
  Radio,
  Server,
  Sparkles,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Wifi,
  Phone,
  Lock,
  ChevronDown,
  Check,
  Globe,
  Layers,
  ArrowUpRight,
  Terminal,
  Cpu,
  Clock,
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'mikrotik' | 'mpesa' | 'billing' | 'telemetry'>('mikrotik');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [simulatedPaymentActive, setSimulatedPaymentActive] = useState(false);
  const [activeSessions, setActiveSessions] = useState(1428);
  const [todayRevenue, setTodayRevenue] = useState(384500);

  // Subtle real-time metric fluctuations to give an alive, dynamic NOC feel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSessions((prev) => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerPaymentSimulation = () => {
    if (simulatedPaymentActive) return;
    setSimulatedPaymentActive(true);
    setTodayRevenue((prev) => prev + 2500);
    setTimeout(() => {
      setSimulatedPaymentActive(false);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Top Notification Announcement Bar */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-cyan-500/10 border-b border-primary/20 py-2.5 px-4 text-center text-xs font-medium relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[11px] font-semibold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            v2.4 Enterprise
          </span>
          <span className="text-muted-foreground">
            Native MikroTik RouterOS v7+ API & Safaricom Daraja 2.0 Webhook Engine
          </span>
          <Link
            href="/admin/network"
            className="inline-flex items-center text-primary hover:underline font-semibold ml-1 group"
          >
            Explore Network NOC <ArrowRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-105 transition-all duration-300 glow-primary shadow-lg shadow-primary/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-6 h-6"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight gradient-text">Net-On</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
                  ISP OS
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground tracking-wide uppercase font-medium">
                Autonomous ISP Platform
              </p>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Platform Features
            </a>
            <a href="#mikrotik" className="hover:text-foreground transition-colors">
              MikroTik & PPPoE
            </a>
            <a href="#mpesa" className="hover:text-foreground transition-colors">
              M-Pesa Reconciliation
            </a>
            <a href="#architecture" className="hover:text-foreground transition-colors">
              Architecture
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="px-4 py-2 text-sm font-medium text-foreground rounded-xl glass hover:bg-white/10 transition-all duration-200 border border-border/80 flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Customer Portal</span>
            </Link>

            <Link
              href="/login"
              className="px-5 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden bg-grid">
        {/* Ambient Glowing Blobs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-40 -left-20 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-60 -right-20 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Live Operational Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-primary/20 text-xs font-medium text-foreground mb-8 shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-semibold">Live System Online:</span>
              <span className="text-muted-foreground">All MikroTik Clusters & Daraja Gateways Operational</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Autonomous ISP Billing &amp; <br />
              <span className="gradient-text">MikroTik Network Control</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-10 font-normal">
              Built specifically for Kenyan and East African ISPs. Automate subscriber PPPoE and Hotspot provisioning, collect real-time M-Pesa payments with zero-touch reconnection, and eliminate revenue leakage forever.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all duration-200 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 group"
              >
                <span>Launch Admin Console</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/portal"
                className="w-full sm:w-auto px-8 py-4 rounded-xl glass font-semibold text-base text-foreground hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 border border-white/15"
              >
                <Users className="w-5 h-5 text-primary" />
                <span>Customer Self-Service</span>
              </Link>

              <button
                onClick={triggerPaymentSimulation}
                className="w-full sm:w-auto px-5 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>Simulate 1-Click Pay</span>
              </button>
            </div>

            {/* Real-time KPI Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl glass border border-white/10 max-w-4xl mx-auto backdrop-blur-2xl">
              <div className="text-center p-3">
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center justify-center gap-1">
                  <span>{activeSessions.toLocaleString()}</span>
                  <span className="text-xs text-emerald-400 font-normal">Active</span>
                </div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">
                  PPPoE & Hotspot Sessions
                </div>
              </div>

              <div className="text-center p-3 border-l border-white/10">
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
                  &lt; 1.2s
                </div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">
                  M-Pesa to Unblock Speed
                </div>
              </div>

              <div className="text-center p-3 border-l border-white/10">
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  KES {(todayRevenue / 1000).toFixed(1)}k
                </div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">
                  Today's Reconciled Pay
                </div>
              </div>

              <div className="text-center p-3 border-l border-white/10">
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
                  99.98%
                </div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">
                  Automated Uptime
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Operations Cockpit Mockup */}
          <div className="mt-14 max-w-5xl mx-auto relative">
            <div className="rounded-2xl border border-white/15 bg-card/75 backdrop-blur-2xl shadow-2xl overflow-hidden">
              {/* Window Header */}
              <div className="h-11 bg-muted/40 border-b border-border/50 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs font-mono text-muted-foreground">
                    neton://noc.cluster.internal/overview
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    RADIUS / ROS API CONNECTED
                  </span>
                </div>
              </div>

              {/* Cockpit Content */}
              <div className="p-6 space-y-6">
                {/* Real-time simulation alert banner if triggered */}
                {simulatedPaymentActive && (
                  <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          [LIVE EVENT] M-Pesa STK Push Completed • KES 2,500
                        </div>
                        <div className="text-xs text-emerald-300/80 font-mono">
                          Receipt: QHJ99824X • Subscriber: Kamau N. (PPPoE: user_kamau) • Reconnected in 840ms
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 font-mono">
                      Queue: BullMQ Processed
                    </span>
                  </div>
                )}

                {/* Grid of live widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* MikroTik Router Nodes */}
                  <div className="p-4 rounded-xl glass border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-primary" /> Router Clusters
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
                        4 / 4 Online
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="font-mono text-foreground">CCR2004-Nairobi-Core</span>
                        <span className="text-emerald-400 font-mono">1.2 Gbps (18% CPU)</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="font-mono text-foreground">CCR1009-Mombasa-Edge</span>
                        <span className="text-emerald-400 font-mono">680 Mbps (12% CPU)</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="font-mono text-foreground">RB4011-Kisumu-Relay</span>
                        <span className="text-emerald-400 font-mono">340 Mbps (9% CPU)</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="font-mono text-foreground">RB5009-Nakuru-Tower</span>
                        <span className="text-emerald-400 font-mono">490 Mbps (14% CPU)</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Queues & Isolation Pool */}
                  <div className="p-4 rounded-xl glass border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" /> Network Isolation
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/20 font-medium">
                        Auto-Enforced
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-muted-foreground">Suspension IP Pool:</span>
                        <span className="font-mono text-yellow-400">10.99.0.0/22 (Walled Garden)</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-muted-foreground">Overdue Accounts Blocked:</span>
                        <span className="font-mono text-foreground">14 subscribers</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-muted-foreground">Self-Care Captive Portal:</span>
                        <span className="font-mono text-emerald-400">Active (Auto-redirect)</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">Zero-Touch Restoration:</span>
                        <span className="font-mono text-primary">Instant on Webhook</span>
                      </div>
                    </div>
                  </div>

                  {/* Safaricom Daraja 2.0 Webhook Status */}
                  <div className="p-4 rounded-xl glass border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> M-Pesa Gateway
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
                        C2B &amp; STK Push
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-muted-foreground">Paybill Account:</span>
                        <span className="font-mono text-foreground font-semibold">408**** (Verified)</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-muted-foreground">Last Reconciled Payment:</span>
                        <span className="font-mono text-emerald-400 font-medium">2 mins ago (KES 3,500)</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-muted-foreground">Unmatched Transactions:</span>
                        <span className="font-mono text-foreground">0 (100% Cleared)</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">SMS Confirmation:</span>
                        <span className="font-mono text-primary">Africa's Talking API</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Terminal Status Line */}
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-muted-foreground flex items-center justify-between overflow-x-auto">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>[Net-On Daemon] PPPoE Secret sync verified: 1,428 active users matched against database.</span>
                  </div>
                  <span className="text-emerald-400 shrink-0 ml-4 font-semibold">ALL SERVICES HEALTHY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Portal Gateway Section */}
      <section className="py-20 border-t border-border/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
              Choose Your Gateway
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 mb-4">
              Two Dedicated Experiences. One Unified Core.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Whether you are an ISP Network Engineer managing tower infrastructure or a subscriber checking your monthly speed, Net-On delivers instant access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card 1: Admin & NOC Gateway */}
            <div className="p-8 rounded-2xl glass border border-white/10 hover:border-primary/40 transition-all duration-300 relative group flex flex-col justify-between hover:shadow-2xl hover:shadow-primary/10">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary glow-primary group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  ISP Operations &amp; NOC Portal
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The complete command center for ISP owners, engineers, and financial auditors. Orchestrate MikroTik routers, manage IP subnets, monitor PPPoE sessions, configure packages, and audit billing runs.
                </p>
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>MikroTik RouterOS API &amp; NAS Management</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Customer Lifecycle &amp; Bandwidth Profile Allocations</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>M-Pesa C2B / STK Logs &amp; Bank Reconciliation</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Staff RBAC, Audit Trails &amp; System Health Telemetry</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href="/login"
                  className="w-full py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <span>Sign In as Staff / Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 2: Subscriber Self-Service Gateway */}
            <div className="p-8 rounded-2xl glass border border-white/10 hover:border-cyan-400/40 transition-all duration-300 relative group flex flex-col justify-between hover:shadow-2xl hover:shadow-cyan-500/10">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  Subscriber Self-Service Portal
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Delight your customers with a frictionless self-service experience. Subscribers can pay overdue bills in 1-click via M-Pesa STK push, view speed tests, download tax invoices, and request support.
                </p>
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>1-Click M-Pesa STK Push Instant Renewal</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Live Bandwidth Consumption &amp; Speed Tiers</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Instant PDF Invoices &amp; Payment Receipts</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Submit &amp; Track Helpdesk Support Tickets</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href="/portal"
                  className="w-full py-3.5 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-foreground font-semibold text-sm border border-white/15 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>Open Customer Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Modules (Interactive Tabs) */}
      <section id="features" className="py-24 border-t border-border/40 bg-card/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
              Engineered for Scale
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-3 mb-4">
              Everything Your ISP Needs to Run on Autopilot
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Built ground-up with high performance NestJS, Prisma ORM, Redis queues, and native MikroTik RouterOS API clients.
            </p>
          </div>

          {/* Feature Tabs Control */}
          <div className="flex justify-center mb-10 overflow-x-auto pb-2">
            <div className="inline-flex p-1.5 rounded-2xl glass border border-white/10 gap-2">
              <button
                onClick={() => setActiveTab('mikrotik')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'mikrotik'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>MikroTik &amp; PPPoE</span>
              </button>

              <button
                onClick={() => setActiveTab('mpesa')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'mpesa'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>M-Pesa Daraja 2.0</span>
              </button>

              <button
                onClick={() => setActiveTab('billing')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'billing'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Smart Billing &amp; Invoicing</span>
              </button>

              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'telemetry'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>NOC Telemetry</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="max-w-5xl mx-auto">
            {activeTab === 'mikrotik' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 rounded-3xl glass border border-white/10 animate-fade-in">
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                    <Radio className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    Native RouterOS API Provisioning &amp; Walled Garden
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Say goodbye to manual WinBox logins. Net-On connects directly to your CCR and RB routers over SSL/TLS API. Automatically create PPPoE secrets, assign dynamic rate limits (Simple Queues &amp; PCQ), and route suspended clients into an isolated Walled Garden pool.
                  </p>
                  <ul className="space-y-3 text-xs text-muted-foreground font-medium">
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Automated PPPoE secret creation and profile tagging</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Zero-downtime queue reconfiguration on plan upgrades</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Automated session termination on account expiry</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Support for MikroTik RouterOS v6 and v7</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-black/80 border border-white/10 font-mono text-xs text-muted-foreground space-y-2">
                  <div className="text-primary font-semibold flex items-center justify-between pb-2 border-b border-white/10">
                    <span>// MikroTik RouterOS API Command</span>
                    <span className="text-[10px] text-emerald-400">STATUS: 200 OK</span>
                  </div>
                  <div className="text-slate-300">
                    &gt; /ppp/secret/add
                  </div>
                  <div className="pl-4 text-cyan-300">
                    name="cust_254712000" <br />
                    password="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" <br />
                    profile="Fiber-20Mbps" <br />
                    remote-address="10.100.4.12" <br />
                    comment="Net-On Auto-Provisioned [Sub #849]"
                  </div>
                  <div className="text-slate-300 pt-2">
                    &gt; /queue/simple/add
                  </div>
                  <div className="pl-4 text-emerald-300">
                    name="queue_cust_254712000" <br />
                    target="10.100.4.12/32" <br />
                    max-limit="20M/20M" burst-limit="30M/30M"
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mpesa' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 rounded-3xl glass border border-white/10 animate-fade-in">
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    Safaricom Daraja 2.0 Webhook Engine &amp; STK Push
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Complete integration with Safaricom M-Pesa. Accept C2B Paybill/Till transactions with automated account-number validation and confirmation. Trigger instant STK Push prompts to customer handsets right from their portal.
                  </p>
                  <ul className="space-y-3 text-xs text-muted-foreground font-medium">
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Instant unblocking in &lt; 1.5 seconds upon payment callback</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Strict idempotency keys to eliminate double-crediting</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Automated SMS payment confirmation to customer</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Handles partial payments and account credit balances</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-black/80 border border-white/10 font-mono text-xs text-muted-foreground space-y-3">
                  <div className="text-emerald-400 font-semibold flex items-center justify-between pb-2 border-b border-white/10">
                    <span>// M-Pesa Daraja 2.0 Callback</span>
                    <span className="text-[10px] text-emerald-400">RECONCILED IN 840ms</span>
                  </div>
                  <pre className="text-slate-300 text-[11px] overflow-x-auto">
{`{
  "TransactionType": "Pay Bill",
  "TransID": "QHJ892KL91",
  "TransAmount": "3500.00",
  "BillRefNumber": "NET-849",
  "MSISDN": "254712***890",
  "Reconciliation": {
    "status": "MATCHED",
    "invoice": "INV-2026-0849",
    "unblockAction": "DISPATCHED_TO_MIKROTIK"
  }
}`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 rounded-3xl glass border border-white/10 animate-fade-in">
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    Automated Invoicing, Proration &amp; Late Notices
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Set recurring billing schedules on the 1st of the month or anniversary cycles. Generate compliant PDF tax invoices, calculate proration automatically when subscribers change tiers, and dispatch scheduled reminder notifications.
                  </p>
                  <ul className="space-y-3 text-xs text-muted-foreground font-medium">
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Bulk automated invoice generation with zero manual work</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>3-day, 1-day, and same-day expiry reminder alerts</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Customizable grace period before automated suspension</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-card border border-white/10 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-xs font-semibold text-foreground">Sample Automated Invoice</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">PAID</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Customer:</span>
                      <span className="text-foreground font-medium">Apex Logistics Hub</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Package:</span>
                      <span className="text-foreground font-medium">Business Dedicated 50 Mbps</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Billing Period:</span>
                      <span className="text-foreground font-medium">01/10/2026 – 31/10/2026</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground border-t border-white/10 pt-2">
                      <span className="font-semibold text-foreground">Total Amount:</span>
                      <span className="font-bold text-primary font-mono text-sm">KES 12,500</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'telemetry' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 rounded-3xl glass border border-white/10 animate-fade-in">
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    Live NOC Telemetry, Traffic Graphs &amp; Alerts
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Gain deep observability across all your towers, access points, and core links. Monitor live bandwidth throughput, CPU spikes, ping jitter, and packet drop before subscribers start calling your helpdesk.
                  </p>
                  <ul className="space-y-3 text-xs text-muted-foreground font-medium">
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Real-time interface bandwidth utilization charts</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Router CPU, temperature, and memory health tracking</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Webhook notifications to Slack, Discord, and Telegram</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-black/80 border border-white/10 space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono text-muted-foreground">
                    <span>TELEMETRY METRICS</span>
                    <span className="text-emerald-400">POLL: 5s INTERVAL</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Core Uplink (10G SFP+)</span>
                        <span className="font-mono text-primary">3.4 Gbps / 10 Gbps</span>
                      </div>
                      <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full w-[34%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">CCR2004 Cluster CPU Load</span>
                        <span className="font-mono text-emerald-400">18% AVG</span>
                      </div>
                      <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full w-[18%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Active PPPoE Secret Match</span>
                        <span className="font-mono text-foreground">1,428 / 1,428 (100%)</span>
                      </div>
                      <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full w-[100%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Workflow Step-by-Step Flow */}
      <section className="py-24 border-t border-border/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              Zero-Touch Lifecycle
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-3 mb-4">
              How Zero-Touch Reconnection Works
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              The automated journey from subscriber payment to instant MikroTik session unblocking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl glass border border-white/10 relative group hover:border-primary/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary font-bold flex items-center justify-center mb-4 text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Subscriber Pays</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Customer pays invoice via M-Pesa STK push or direct Paybill transaction with their account number.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl glass border border-white/10 relative group hover:border-primary/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center mb-4 text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Daraja Webhook</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Safaricom sends encrypted webhook callback to Net-On API with receipt code and amount.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl glass border border-white/10 relative group hover:border-primary/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mb-4 text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Instant Match</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Net-On reconciles payment with open invoice, logs ledger entry, and queues MikroTik unblock command.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl glass border border-white/10 relative group hover:border-primary/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center mb-4 text-sm">
                04
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">MikroTik Unblocked</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Router moves client out of isolation pool and restores full bandwidth in under 1.2 seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-24 border-t border-border/40 bg-card/20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
              Answers &amp; Technical Details
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Got questions about integrating Net-On into your existing network?
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Which MikroTik RouterOS versions are compatible with Net-On?',
                a: 'Net-On supports both RouterOS v6 (v6.45+) and RouterOS v7+. We utilize the native MikroTik API over SSL/TLS port 8729, which eliminates security risks associated with plain Telnet or unencrypted SSH scripting.',
              },
              {
                q: 'How does automated M-Pesa reconciliation prevent duplicate or fraudulent payments?',
                a: 'Every M-Pesa transaction is validated against Safaricom’s Daraja 2.0 API using unique Safaricom TransIDs, idempotency locks in Redis, and strict timestamp validation. Duplicate webhooks are rejected immediately with zero risk of double crediting.',
              },
              {
                q: 'What happens if our connection to a remote tower router temporarily drops?',
                a: 'Net-On employs BullMQ resilient job queues backed by Redis with exponential backoff and persistent retries. If a remote router is unreachable during an unblock event, the job retries automatically as soon as the node reconnects.',
              },
              {
                q: 'Can customers use the Customer Portal on mobile phones?',
                a: 'Yes! The Net-On Customer Portal is 100% responsive and optimized for mobile devices. Subscribers can initiate 1-click M-Pesa STK push renewals directly on their phones with no app install required.',
              },
              {
                q: 'How are database backups and customer records protected?',
                a: 'The system incorporates automated AES-256 encrypted database dumps that sync offsite daily to S3-compatible cloud storage. Passphrases are stored in hardened, restricted system vaults away from the web root.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl glass border border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0 ${
                      openFaq === idx ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-20 border-t border-border/40 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="p-10 sm:p-16 rounded-3xl glass border border-primary/30 relative overflow-hidden bg-gradient-to-b from-primary/10 to-transparent">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-6 glow-primary">
              <Sparkles className="w-8 h-8" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
              Ready to Upgrade Your ISP Operations?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto mb-8">
              Experience automated provisioning, instant M-Pesa billing, and effortless network control. Launch your console or explore subscriber self-service.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/portal"
                className="w-full sm:w-auto px-8 py-4 rounded-xl glass font-semibold text-sm text-foreground hover:bg-white/10 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 border border-white/15"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Subscriber Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/40 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight gradient-text">Net-On</span>
              <span className="text-xs text-muted-foreground border-l border-border/60 pl-3">
                Professional ISP Management Platform
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link href="/login" className="hover:text-foreground transition-colors">
                Admin Console
              </Link>
              <Link href="/portal" className="hover:text-foreground transition-colors">
                Subscriber Portal
              </Link>
              <Link href="/admin/network" className="hover:text-foreground transition-colors">
                Network Topology
              </Link>
              <span className="text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                v2.4 Production Ready
              </span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
            <p>&copy; {new Date().getFullYear()} Net-On ISP Management Platform. All rights reserved.</p>
            <p className="font-mono text-[11px]">Safaricom Daraja 2.0 &bull; MikroTik RouterOS API &bull; Redis BullMQ</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
