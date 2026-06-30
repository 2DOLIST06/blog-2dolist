import { getArticlePath, type Locale } from '@/lib/i18n/routing';
import type { Post } from '@/types/content';

const normalizeInternalPath = (path: string) => {
  const trimmed = path.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

export const getPostHref = (post: Pick<Post, 'path' | 'slug' | 'locale'>, locale: Locale = post.locale) =>
  normalizeInternalPath(post.path ?? '') ?? getArticlePath(locale, post.slug);
