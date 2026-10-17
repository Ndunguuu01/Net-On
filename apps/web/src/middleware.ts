// ============================================
// Net-On — Next.js Route Protection Middleware
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('neton_token')?.value;

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect all /portal routes (except /portal/login)
  if (pathname.startsWith('/portal') && pathname !== '/portal/login') {
    if (!token) {
      const portalLoginUrl = new URL('/portal/login', request.url);
      portalLoginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(portalLoginUrl);
    }
  }

  // Redirect away from /login if already authenticated
  if (pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Redirect away from /portal/login if already authenticated
  if (pathname === '/portal/login') {
    if (token) {
      return NextResponse.redirect(new URL('/portal', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/login', '/portal/login'],
};
