import type { Metadata } from 'next';
import { getPostHref } from '@/lib/content/urls';
import { getArticlePath, type Locale } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site/config';
import type { Post } from '@/types/content';

export const buildPostMetadata = (post: Post): Metadata =>
  buildMetadata({
    title: `${post.title} | ${siteConfig.name}`,
    description: post.description,
    path: getPostHref(post, 'fr'),
    locale: 'fr',
    image: post.coverImage,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    keywords: post.tags
  });

export const buildMissingPostMetadata = (slugOrPath: string, locale: Locale): Metadata =>
  buildMetadata({
    title: `Article introuvable | ${siteConfig.name}`,
    description: "L’article demandé est introuvable.",
    path: slugOrPath.startsWith('/') ? slugOrPath : getArticlePath(locale, slugOrPath),
    locale,
    noIndex: true
  });
