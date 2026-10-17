'use client';

// ============================================
// Net-On — Admin Sidebar Component
// ============================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Repeat,
  FileText,
  CreditCard,
  Router,
  Bell,
  HelpCircle,
  ShieldCheck,
  Settings,
  Activity,
  BarChart3,
  UserCog,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const navigationGroups: SidebarGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Network', href: '/admin/network', icon: Activity },
      { name: 'Live Sessions', href: '/admin/network/live', icon: Activity, badge: 'Live', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    ],
  },
  {
    title: 'SUBSCRIBERS & BILLING',
    items: [
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Packages', href: '/admin/packages', icon: Package },
      { name: 'Subscriptions', href: '/admin/subscriptions', icon: Repeat },
      { name: 'Invoices', href: '/admin/invoices', icon: FileText },
      { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    ],
  },
  {
    title: 'INFRASTRUCTURE',
    items: [
      { name: 'Routers & NAS', href: '/admin/routers', icon: Router },
      { name: 'Notifications', href: '/admin/notifications', icon: Bell },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
      { name: 'Staff', href: '/admin/staff', icon: UserCog },
      { name: 'Support Tickets', href: '/admin/support', icon: HelpCircle },
      { name: 'Audit Logs', href: '/admin/audit', icon: ShieldCheck },
      { name: 'System Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card/60 backdrop-blur-xl border-r border-border/40 flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      {/* Top Section: Brand */}
      <div>
        <div className="h-16 px-6 flex items-center border-b border-border/40">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-all duration-200 glow-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
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
              <span className="font-bold text-lg gradient-text tracking-tight">Net-On</span>
              <span className="block text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">ISP Platform</span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="px-3 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)] custom-scrollbar">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 group ${
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold border border-primary/20 shadow-sm shadow-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded border ${
                            item.badgeColor || 'bg-primary/20 text-primary border-primary/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: System Status */}
      <div className="p-4 border-t border-border/40 bg-background/40">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-card/40 border border-border/30">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute inset-0 opacity-75" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-foreground">System Online</div>
            <div className="text-[9px] text-muted-foreground">v1.0.0 • MikroTik RouterOS API</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
