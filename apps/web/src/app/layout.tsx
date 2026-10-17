import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { ToastProvider } from '@/context/toast-context';

export const metadata: Metadata = {
  title: {
    default: 'Net-On | ISP Management Platform',
    template: '%s | Net-On',
  },
  description:
    'Net-On — Professional ISP management platform for customer billing, network automation, and business analytics.',
  keywords: ['ISP', 'billing', 'MikroTik', 'M-Pesa', 'network management', 'Kenya'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
