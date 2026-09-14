import type { Metadata } from 'next';
import { getPostHref } from '@/lib/content/urls';
import { getArticlePath, type Locale } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site/config';
import type { Post } from '@/types/content';
import { getValidModifiedDate } from '@/lib/seo/jsonld';

export const withTrailingSlash = (value: string) => {
  const [withoutHash, hash = ''] = value.split('#', 2);
  const [pathname, query = ''] = withoutHash.split('?', 2);
  const normalized = pathname === '/' || pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${normalized}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
};

export const buildPostMetadata = (post: Post): Metadata =>
  buildMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    path: withTrailingSlash(post.path || getPostHref(post, 'fr')),
    canonicalUrl: post.canonicalUrl ? withTrailingSlash(post.canonicalUrl) : undefined,
    locale: 'fr',
    noIndex: post.isIndexable === false,
    follow: true,
    image: post.coverImage,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: getValidModifiedDate(post.publishedAt, post.updatedAt)
  });

export const buildMissingPostMetadata = (slugOrPath: string, locale: Locale): Metadata =>
  buildMetadata({
    title: `Article introuvable | ${siteConfig.name}`,
    description: "L’article demandé est introuvable.",
    path: slugOrPath.startsWith('/') ? slugOrPath : getArticlePath(locale, slugOrPath),
    locale,
    noIndex: true
  });
