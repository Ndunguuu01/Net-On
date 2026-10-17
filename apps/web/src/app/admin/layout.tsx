'use client';

// ============================================
// Net-On — Admin Route Guard Layout
// ============================================

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AdminLayout } from '@/components/admin/admin-layout';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <div className="text-xs text-muted-foreground">Authenticating session...</div>
        </div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
