import 'server-only';

import type { Author, Category, Post, PostSection, RelatedPostSummary } from '@/types/content';

const CMS_API_URL = process.env.NEXT_PUBLIC_CMS_API_URL;
const DEFAULT_IMAGE = '/og-default.svg';
const DEFAULT_AVATAR = '/og-default.svg';

interface CmsListResponse<T> { docs?: T[]; totalDocs?: number; page?: number; totalPages?: number }
interface CmsMedia { url?: string | null }
interface CmsCategory { id: string; slug: string; title?: string | null; name?: string | null; description?: string | null }
interface CmsAuthor { id: string; slug: string; name?: string | null; bio?: string | null; avatar?: CmsMedia | null }
interface CmsPost {
  id: string; slug: string; title?: string | null; excerpt?: string | null; content?: string | null; publishedAt?: string | null;
  updatedAt?: string | null; status?: string | null; image?: CmsMedia | null; category?: CmsCategory | string | null; author?: CmsAuthor | string | null;
}

export interface PostsQuery { page?: number; limit?: number; category?: string; search?: string }
export interface PostsResult { posts: Post[]; totalPages: number; page: number; totalDocs: number }

const toSections = (content?: string | null, excerpt?: string | null): PostSection[] => [{ heading: 'Contenu', content: [content?.trim() || excerpt?.trim() || 'Contenu indisponible.'] }];

const toCmsAssetUrl = (url?: string | null) => {
  const trimmed = url?.trim() || '';
  if (!trimmed) return trimmed;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(trimmed) || !CMS_API_URL) return trimmed;

  let origin = CMS_API_URL.replace(/\/$/, '');
  try {
    origin = new URL(CMS_API_URL).origin;
  } catch {
    // Keep the normalized CMS_API_URL fallback above.
  }
  if (trimmed.startsWith('/')) return `${origin}${trimmed}`;
  return `${origin}/${trimmed}`;
};

const withTimeout = async (input: string, init: RequestInit, timeoutMs = 6000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(input, { ...init, signal: controller.signal }); } finally { clearTimeout(timeout); }
};

async function cmsFetch<T>(path: string, revalidate = 120): Promise<T | null> {
  if (!CMS_API_URL) return null;
  const url = `${CMS_API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await withTimeout(url, { next: { revalidate } });
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch (error) {
      if (attempt === 1) {
        console.error('[cms] fetch failed', { path, error });
      }
    }
  }
  return null;
}

const mapCategory = (c: CmsCategory): Category => ({ id: c.id, slug: c.slug, title: c.title?.trim() || c.name?.trim() || 'Catégorie', description: c.description?.trim() || 'Sans description.' });
const mapAuthor = (a?: CmsAuthor | null): Author => ({ id: a?.id || 'unknown-author', slug: a?.slug || 'auteur-inconnu', name: a?.name?.trim() || 'Équipe éditoriale', role: 'Auteur', bio: a?.bio?.trim() || 'Auteur.', avatar: toCmsAssetUrl(a?.avatar?.url) || DEFAULT_AVATAR });
const mapPost = (p: CmsPost): Post => {
  const category = typeof p.category === 'object' && p.category ? p.category : null;
  const author = typeof p.author === 'object' && p.author ? p.author : null;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title?.trim() || 'Sans titre',
    excerpt: p.excerpt?.trim() || '',
    description: p.excerpt?.trim() || '',
    coverImage: toCmsAssetUrl(p.image?.url) || DEFAULT_IMAGE,
    publishedAt: p.publishedAt || p.updatedAt || new Date().toISOString(),
    updatedAt: p.updatedAt || undefined,
    readingMinutes: 5,
    categorySlug: category?.slug || 'non-classe',
    authorSlug: author?.slug || 'auteur-inconnu',
    tags: [],
    sections: toSections(p.content, p.excerpt),
    locale: 'en',
    translationGroupId: p.id,
    path: `/articles/${p.slug}`
  };
};

export async function getPublishedPosts({ page = 1, limit = 9, category, search }: PostsQuery): Promise<PostsResult> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), where: JSON.stringify({ status: { equals: 'published' } }), sort: '-publishedAt', depth: '2' });
  if (category) params.set('where', JSON.stringify({ and: [{ status: { equals: 'published' } }, { 'category.slug': { equals: category } }] }));
  if (search) params.set('where', JSON.stringify({ and: [{ status: { equals: 'published' } }, { title: { like: search } }] }));
  const data = await cmsFetch<CmsListResponse<CmsPost>>(`/api/posts?${params.toString()}`);
  const posts = data?.docs?.map(mapPost) ?? [];
  return { posts, totalPages: data?.totalPages ?? 1, page: data?.page ?? page, totalDocs: data?.totalDocs ?? posts.length };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const where = encodeURIComponent(JSON.stringify({ and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] }));
  const data = await cmsFetch<CmsListResponse<CmsPost>>(`/api/posts?where=${where}&limit=1&depth=2`);
  const first = data?.docs?.[0];
  return first ? mapPost(first) : null;
}

export async function getCategories(): Promise<Category[]> {
  const data = await cmsFetch<CmsListResponse<CmsCategory>>('/api/categories?limit=100&sort=title');
  return data?.docs?.map(mapCategory) ?? [];
}

export async function getRelatedPosts(postId: string, categorySlug?: string): Promise<RelatedPostSummary[]> {
  const where = encodeURIComponent(JSON.stringify({ and: [{ status: { equals: 'published' } }, { id: { not_equals: postId } }, ...(categorySlug ? [{ 'category.slug': { equals: categorySlug } }] : [])] }));
  const data = await cmsFetch<CmsListResponse<CmsPost>>(`/api/posts?where=${where}&limit=3&sort=-publishedAt`);
  return (data?.docs ?? []).map((p) => ({ slug: p.slug, title: p.title?.trim() || 'Sans titre', excerpt: p.excerpt?.trim() || '', coverImage: toCmsAssetUrl(p.image?.url) || DEFAULT_IMAGE, publishedAt: p.publishedAt || p.updatedAt || new Date().toISOString() }));
}

export async function getPostAuthorBySlug(slug: string): Promise<Author | undefined> {
  const where = encodeURIComponent(JSON.stringify({ slug: { equals: slug } }));
  const data = await cmsFetch<CmsListResponse<CmsAuthor>>(`/api/authors?where=${where}&limit=1`);
  return data?.docs?.[0] ? mapAuthor(data.docs[0]) : undefined;
}
