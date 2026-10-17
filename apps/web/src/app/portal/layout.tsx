'use client';

// ============================================
// Net-On — Customer Portal Layout
// ============================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Repeat,
  FileText,
  CreditCard,
  HelpCircle,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const portalNav = [
  { name: 'Dashboard', href: '/portal', icon: LayoutDashboard },
  { name: 'My Plan', href: '/portal/subscription', icon: Repeat },
  { name: 'Invoices', href: '/portal/invoices', icon: FileText },
  { name: 'Payments', href: '/portal/payments', icon: CreditCard },
  { name: 'Support', href: '/portal/support', icon: HelpCircle },
  { name: 'My Profile', href: '/portal/profile', icon: User },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // If on the login page, render without chrome
  const isLoginPage = pathname === '/portal/login';

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('neton_access_token') : null;
    if (!token) {
      router.push('/portal/login');
      return;
    }

    // Fetch profile
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    fetch(`${apiBase}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json();
      })
      .then((data) => {
        const profile = data.data || data;
        setUser(profile);
        setIsLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('neton_access_token');
        router.push('/portal/login');
      });
  }, [isLoginPage, router]);

  const handleLogout = () => {
    localStorage.removeItem('neton_access_token');
    localStorage.removeItem('neton_refresh_token');
    document.cookie = 'neton_token=; path=/; max-age=0';
    router.push('/portal/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <div className="text-xs text-muted-foreground">Loading your account...</div>
        </div>
      </div>
    );
  }

  const customerName = user?.customer
    ? `${user.customer.firstName} ${user.customer.lastName}`
    : user?.email || 'Customer';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Header Bar */}
      <header className="h-14 bg-card/60 backdrop-blur-xl border-b border-border/40 sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/portal" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center glow-primary">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-primary" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-sm gradient-text">Net-On</span>
              <span className="hidden sm:block text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Customer Portal</span>
            </div>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {portalNav.map((item) => {
            const isActive = item.href === '/portal' ? pathname === '/portal' : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-foreground">{customerName}</div>
            <div className="text-[10px] text-muted-foreground">{user?.customer?.customerNumber || 'Portal'}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-14">
          <nav className="p-4 space-y-1">
            {portalNav.map((item) => {
              const isActive = item.href === '/portal' ? pathname === '/portal' : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 w-full mt-4"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
