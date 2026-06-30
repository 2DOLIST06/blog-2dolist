'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { siteConfig } from '@/lib/constants';
import { getNavigation, getPathLocale } from '@/lib/i18n/routing';

export function Footer() {
  const pathname = usePathname();
  const locale = getPathLocale(pathname ?? '/');
  const navigation = getNavigation(locale);

  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-10">
      <Container>
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold text-slate-900">{siteConfig.name}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {siteConfig.description}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Navigation</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Newsletter</h3>
            <p className="mt-2 text-sm text-slate-600">{locale === 'fr' ? 'Recevez les nouveaux contenus du blog.' : 'Get the latest blog content.'}</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
