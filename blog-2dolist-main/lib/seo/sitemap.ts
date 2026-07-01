import type { MetadataRoute } from 'next';
import { contentRepository } from '@/lib/content/repository';
import { siteConfig } from '@/lib/constants';
import { absoluteUrl, getCategoryPath } from '@/lib/i18n/routing';
import type { Locale } from '@/lib/i18n/routing';

const staticPathsByLocale: Record<Locale, string[]> = {
  en: [],
  fr: ['/', '/articles', '/categories', '/about', '/contact']
};

export const getLocalizedSitemap = async (locale: Locale): Promise<MetadataRoute.Sitemap> => {
  const [posts, categories] = await Promise.all([
    contentRepository.getAllPostsByLocale(locale),
    contentRepository.getAllCategoriesByLocale(locale)
  ]);

  const staticPages: MetadataRoute.Sitemap = staticPathsByLocale[locale].map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date()
  }));

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(post.path ?? `/articles/${post.slug}`),
    lastModified: new Date(post.updatedAt ?? post.publishedAt)
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(getCategoryPath(locale, category.slug)),
    lastModified: new Date()
  }));

  return [...staticPages, ...postPages, ...categoryPages];
};

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export const renderSitemapXml = (entries: MetadataRoute.Sitemap) => {
  const urls = entries
    .map((entry) => {
      const lastModified = entry.lastModified ? `\n    <lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(entry.url)}</loc>${lastModified}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

export const sitemapResponse = async (locale: Locale) =>
  new Response(renderSitemapXml(await getLocalizedSitemap(locale)), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600'
    }
  });

export const robotsTxt = `User-agent: *\nAllow: /\nSitemap: ${siteConfig.baseUrl}/sitemap.xml\n`;
