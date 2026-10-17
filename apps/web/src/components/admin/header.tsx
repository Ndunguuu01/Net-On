'use client';

// ============================================
// Net-On — Admin Header Component
// ============================================

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 border-b border-border/40 bg-card/40 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Bar */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search customers, IP addresses, invoices (Ctrl+K)..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background/60 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Environment Indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>PostgreSQL & Redis Ready</span>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-card border border-border/60 shadow-xl py-2 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-border/40 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Notifications</span>
                <span className="text-[10px] text-primary hover:underline cursor-pointer">Mark all as read</span>
              </div>
              <div className="divide-y divide-border/30 max-h-64 overflow-y-auto custom-scrollbar">
                <div className="p-3 text-xs hover:bg-accent/30 transition-colors cursor-pointer">
                  <div className="font-semibold text-foreground">System Initialized</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Net-On ISP Platform ready for customer onboarding.</div>
                  <div className="text-[9px] text-muted-foreground/60 mt-1">Just now</div>
                </div>
                <div className="p-3 text-xs hover:bg-accent/30 transition-colors cursor-pointer">
                  <div className="font-semibold text-emerald-400">Router Sync OK</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">MikroTik RouterOS API connection established.</div>
                  <div className="text-[9px] text-muted-foreground/60 mt-1">5 minutes ago</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-border/40" />

        {/* User Profile Popover */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-accent/50 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-foreground leading-tight">
                {user?.customer ? `${user.customer.firstName} ${user.customer.lastName}` : user?.email?.split('@')[0]}
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-primary" />
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase">
                  {user?.role || 'SUPER_ADMIN'}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* User Menu Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border/60 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-border/40">
                <div className="text-xs font-bold text-foreground truncate">{user?.email}</div>
                <div className="text-[10px] text-muted-foreground">Signed in as {user?.role}</div>
              </div>

              <a
                href="/admin/settings"
                className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account Profile</span>
              </a>

              <div className="border-t border-border/40 my-1" />

              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
