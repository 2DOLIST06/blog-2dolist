import { buildPublicApiUrl } from '@/lib/api/env';
import { absoluteUrl, localizePath, type Hreflang, type Locale } from '@/lib/i18n/routing';
import type { SeoInput } from '@/types/seo';

interface ApiPageSeo {
  title?: string | null;
  metaTitle?: string | null;
  description?: string | null;
  metaDescription?: string | null;
  keywords?: string[] | string | null;
  path?: string | null;
  canonicalUrl?: string | null;
  hreflang?: Array<{ hreflang?: Hreflang | null; href?: string | null }> | Record<string, string> | null;
  meta?: { hreflang?: Array<{ hreflang?: Hreflang | null; href?: string | null }> | Record<string, string> | null } | null;
}

const normalizeHreflang = (value: ApiPageSeo['hreflang']) => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if ((item.hreflang !== 'en' && item.hreflang !== 'fr' && item.hreflang !== 'x-default') || !item.href?.trim()) return [];
      return [{ hreflang: item.hreflang, href: item.href.trim() }];
    });
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([hreflang, href]) => {
      if ((hreflang !== 'en' && hreflang !== 'fr' && hreflang !== 'x-default') || typeof href !== 'string' || !href.trim()) return [];
      return [{ hreflang, href: href.trim() } as { hreflang: Hreflang; href: string }];
    });
  }

  return undefined;
};

const normalizeKeywords = (keywords: ApiPageSeo['keywords']) => {
  if (Array.isArray(keywords)) return keywords.map((keyword) => keyword.trim()).filter(Boolean);
  if (typeof keywords === 'string') return keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean);
  return undefined;
};

const unwrapPageSeo = (payload: unknown): ApiPageSeo | undefined => {
  if (!payload || typeof payload !== 'object') return undefined;
  const root = payload as { data?: unknown; meta?: unknown; seo?: unknown; page?: unknown };
  const candidates = [root.data, root.seo, root.page, payload];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return { ...(candidate as ApiPageSeo), meta: (candidate as ApiPageSeo).meta ?? (root.meta as ApiPageSeo['meta']) };
    }
  }
  return undefined;
};

export async function getPageSeo(key: string, locale: Locale, fallback: SeoInput): Promise<SeoInput> {
  try {
    const response = await fetch(buildPublicApiUrl(`/api/seo/pages/${key}?locale=${locale}`), { next: { revalidate: 60 } });
    if (!response.ok) return fallback;
    const pageSeo = unwrapPageSeo(await response.json().catch(() => ({})));
    if (!pageSeo) return fallback;

    const path = pageSeo.path?.trim() || fallback.path || localizePath('/', locale);
    const hreflang = normalizeHreflang(pageSeo.hreflang) ?? normalizeHreflang(pageSeo.meta?.hreflang) ?? fallback.hreflang;

    return {
      ...fallback,
      title: pageSeo.metaTitle?.trim() || pageSeo.title?.trim() || fallback.title,
      description: pageSeo.metaDescription?.trim() || pageSeo.description?.trim() || fallback.description,
      path,
      canonicalUrl: pageSeo.canonicalUrl?.trim() || fallback.canonicalUrl || absoluteUrl(path),
      locale,
      hreflang,
      keywords: normalizeKeywords(pageSeo.keywords) ?? fallback.keywords
    };
  } catch {
    return fallback;
  }
}
