'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { absoluteUrl, getLocaleFromPathname, getArticlesPath, localizePath, stripLocalePrefix, type Locale } from '@/lib/i18n/routing';

const getPathFromHref = (href: string) => {
  try {
    return new URL(href, absoluteUrl('/')).pathname;
  } catch {
    return href.startsWith('/') ? href : `/${href}`;
  }
};

const isArticleDetailPath = (basePath: string) => /^\/articles\/[^/]+\/?$/.test(basePath);

const buildGenericTarget = (pathname: string, targetLocale: Locale) => {
  const basePath = stripLocalePrefix(pathname);
  const targetBasePath = isArticleDetailPath(basePath) ? getArticlesPath('en') : basePath;
  return localizePath(targetBasePath, targetLocale);
};

export function LanguageSwitcher() {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const locale = getLocaleFromPathname(pathname);
  const targetLocale: Locale = locale === 'fr' ? 'en' : 'fr';
  const queryString = searchParams.toString();
  const genericHref = useMemo(() => buildGenericTarget(pathname, targetLocale), [pathname, targetLocale]);
  const [alternateHref, setAlternateHref] = useState<string | null>(null);

  useEffect(() => {
    const alternate = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${targetLocale}"]`);
    setAlternateHref(alternate?.href ? getPathFromHref(alternate.href) : null);
  }, [pathname, targetLocale]);

  const href = `${alternateHref ?? genericHref}${queryString ? `?${queryString}` : ''}`;

  return (
    <Link href={href} className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950">
      {targetLocale === 'fr' ? 'FR' : 'EN'}
    </Link>
  );
}
