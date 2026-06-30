import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { GoogleTagManager } from '@next/third-parties/google';
import './globals.css';
import { AppLayoutBoundary } from './AppLayoutBoundary';
import { siteConfig } from '@/lib/constants';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/routing';

export const metadata: Metadata = buildMetadata({
  title: siteConfig.defaultMetaTitle,
  description: siteConfig.description,
  path: '/',
  locale: 'en'
});

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = ((await headers()).get('x-body-training-guide-locale') === 'fr' ? 'fr' : 'en') satisfies Locale;

  return (
    <html lang={locale}>
      <GoogleTagManager gtmId="GTM-PGQQXCNN" />
      <body>
        <AppLayoutBoundary>{children}</AppLayoutBoundary>
      </body>
    </html>
  );
}
