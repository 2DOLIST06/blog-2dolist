import type { Metadata } from 'next';
import { GoogleTagManager } from '@next/third-parties/google';
import './globals.css';
import { AppLayoutBoundary } from './AppLayoutBoundary';
import { siteConfig } from '@/lib/constants';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: siteConfig.defaultMetaTitle,
  description: siteConfig.description,
  path: '/',
  locale: 'fr'
});

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = 'fr';

  return (
    <html lang={locale}>
       <head>
        <script
          async
          defer
          src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
          data-gyg-partner-id="32QOCNG"
        />
      </head>
      <GoogleTagManager gtmId="GTM-PGQQXCNN" />
      <body>
        <AppLayoutBoundary>{children}</AppLayoutBoundary>
      </body>
    </html>
  );
}
