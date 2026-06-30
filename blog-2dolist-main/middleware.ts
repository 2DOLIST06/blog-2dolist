import { NextResponse, type NextRequest } from 'next/server';
import { getPathLocale } from '@/lib/i18n/routing';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-body-training-guide-locale', getPathLocale(request.nextUrl.pathname));
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api|admin-api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
