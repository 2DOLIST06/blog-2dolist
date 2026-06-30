import type { Hreflang, Locale } from '@/lib/i18n/routing';

export interface SeoInput {
  title: string;
  description: string;
  path?: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  locale?: Locale;
  hreflang?: Array<{ hreflang: Hreflang; href: string }>;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
}
