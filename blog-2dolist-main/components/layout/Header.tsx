'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/lib/constants';
import { getNavigation, getPathLocale } from '@/lib/i18n/routing';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Container } from '@/components/ui/Container';

export function Header() {
  const pathname = usePathname();
  const locale = getPathLocale(pathname ?? '/');
  const navigation = getNavigation(locale);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href={locale === 'fr' ? '/fr' : '/'} className="text-lg font-bold text-slate-900">
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-5">
            <nav className="flex gap-5 text-sm font-medium text-slate-600">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </Container>
    </header>
  );
}
