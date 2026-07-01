import { NextResponse, type NextRequest } from 'next/server';
import { getPathLocale, stripLocalePrefix } from '@/lib/i18n/routing';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/fr' || request.nextUrl.pathname.startsWith('/fr/')) {
    const url = request.nextUrl.clone();
    url.pathname = stripLocalePrefix(request.nextUrl.pathname);
    return NextResponse.redirect(url, 308);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-body-training-guide-locale', getPathLocale(request.nextUrl.pathname));
  requestHeaders.set('x-blog-locale', 'fr');
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api|admin-api|_next/static|_next/image|favicon.ico).*)']
};
