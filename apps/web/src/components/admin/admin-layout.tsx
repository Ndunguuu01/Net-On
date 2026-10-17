'use client';

// ============================================
// Net-On — Admin Layout Component
// ============================================

import React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 glow-primary">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div className="text-xs font-semibold text-muted-foreground">Loading Net-On Portal...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Layout guard fallback (handled by page wrapper)
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
