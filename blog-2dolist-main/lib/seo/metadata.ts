import type { Metadata } from 'next';
import { siteConfig } from '@/lib/constants';
import { absoluteUrl } from '@/lib/i18n/routing';
import type { SeoInput } from '@/types/seo';
export { absoluteUrl } from '@/lib/i18n/routing';

export const buildMetadata = (input: SeoInput): Metadata => {
  const canonical = input.canonicalUrl ?? absoluteUrl(input.canonicalPath ?? input.path ?? '/');
  const image = input.image ?? siteConfig.defaultOgImage;
  return {
    metadataBase: new URL(siteConfig.baseUrl),
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical
    },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: input.type ?? 'website',
      url: canonical,
      title: input.title,
      description: input.description,
      siteName: siteConfig.name,
      locale: input.locale,
      images: [{ url: image }],
      publishedTime: input.publishedTime,
      modifiedTime: input.modifiedTime
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [image]
    }
  };
};
