import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/me', '/api/accounts/bootstrap'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public assets and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/api/qubito/entitlements')
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Don't block API routes except auth/bootstrap
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get('qubito_session')?.value);
  if (!hasSession) {
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
