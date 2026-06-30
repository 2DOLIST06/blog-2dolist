export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || 'Blog';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://example.com').replace(/\/$/, '');
export const DEFAULT_LOCALE = 'en' as const;
export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export const DEFAULT_OG_IMAGE = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE?.trim() || '/og-default.svg';
export const DEFAULT_META_TITLE = process.env.NEXT_PUBLIC_DEFAULT_META_TITLE?.trim() || SITE_NAME;
export const DEFAULT_META_DESCRIPTION =
  process.env.NEXT_PUBLIC_DEFAULT_META_DESCRIPTION?.trim() || 'Articles and resources from the blog.';

export const siteConfig = {
  name: SITE_NAME,
  description: DEFAULT_META_DESCRIPTION,
  baseUrl: SITE_URL,
  defaultOgImage: DEFAULT_OG_IMAGE,
  defaultMetaTitle: DEFAULT_META_TITLE,
  defaultLocale: DEFAULT_LOCALE,
  supportedLocales: SUPPORTED_LOCALES
};
