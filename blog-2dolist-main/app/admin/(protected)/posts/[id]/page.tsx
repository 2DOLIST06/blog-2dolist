'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PostEditorForm } from '@/components/admin/PostEditorForm';
import { AdminApiError, adminApi } from '@/lib/admin/api-client';
import type { RichContentValue } from '@/components/admin/RichContentEditor';
import type { Locale } from '@/lib/i18n/routing';

type FaqItem = { question: string; answer: string };

type ApiPost = Record<string, unknown> & {
  id?: string;
  slug?: string;
  title?: string;
  h1?: string | null;
  chapoHtml?: string | null;
  contentHtml?: string | null;
  contentMarkdown?: string | null;
  contentJson?: unknown;
  faqJson?: unknown;
  coverImageId?: string | null;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  isActive?: boolean | null;
  isIndexable?: boolean | null;
  categoryId?: string | null;
  categorySlug?: string | null;
  tagsJson?: unknown;
  jsonLd?: unknown;
  status?: string | null;
  locale?: Locale | null;
  translationGroupId?: string | null;
  translations?: Array<{ id?: string | null; locale?: Locale | null; slug?: string | null; path?: string | null; canonicalUrl?: string | null }> | null;
  authorId?: string | null;
  author?: { id?: string | null } | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    canonicalUrl?: string | null;
    noIndex?: boolean | null;
  } | null;
  category?: { id?: string | null; slug?: string | null; title?: string | null; name?: string | null } | null;
  coverImage?: { id?: string | null; url?: string | null } | null;
  tags?: Array<{ slug?: string | null; name?: string | null }>;
};

type EditorInitialPost = {
  id?: string;
  slug?: string;
  title?: string;
  h1?: string;
  chapoHtml?: string;
  contentHtml?: string;
  contentJson?: RichContentValue;
  faqJson?: FaqItem[];
  coverImageId?: string;
  coverImageUrl?: string;
  coverImage?: { id?: string | null; url?: string | null } | null;
  heroImageUrl?: string;
  heroImageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  robots?: string;
  isActive?: boolean;
  isIndexable?: boolean;
  categoryId?: string;
  categorySlug?: string;
  tagsJson?: string[];
  jsonLd?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'draft' | 'published';
  authorId?: string;
  author?: { id?: string | null } | null;
  locale?: Locale;
  translationGroupId?: string;
  translations?: Array<{ id?: string; locale: Locale; slug: string; path: string; canonicalUrl?: string }>;
};

type SinglePostResponse = { data?: ApiPost } | ApiPost;
type PostsListResponse = { data?: ApiPost[]; posts?: ApiPost[]; items?: ApiPost[]; docs?: ApiPost[] } | ApiPost[];

const isDev = process.env.NODE_ENV !== 'production';

const debugEditLoad = (message: string, details?: unknown) => {
  if (isDev) console.debug(`[admin-post-edit] ${message}`, details ?? '');
};

const logEditLoadError = (message: string, error: unknown) => {
  if (isDev) console.error(`[admin-post-edit] ${message}`, error);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const extractPost = (payload: SinglePostResponse): ApiPost | undefined => {
  if (isRecord(payload) && isRecord(payload.data)) return payload.data as ApiPost;
  if (isRecord(payload)) {
    const candidate = payload as Record<string, unknown>;
    if (typeof candidate.id === 'string' || typeof candidate.slug === 'string') return payload as ApiPost;
  }
  return undefined;
};

const extractPosts = (payload: PostsListResponse): ApiPost[] => {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload)) {
    for (const key of ['data', 'posts', 'items', 'docs'] as const) {
      const value = payload[key];
      if (Array.isArray(value)) return value as ApiPost[];
    }
  }
  return [];
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === 'string' ? item : '')).filter(Boolean);
};

const toFaqItems = (value: unknown): FaqItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      return {
        question: typeof item.question === 'string' ? item.question : '',
        answer: typeof item.answer === 'string' ? item.answer : ''
      };
    })
    .filter((item): item is FaqItem => item !== null);
};

const normalizeContentJson = (post: ApiPost): RichContentValue => {
  if (isRecord(post.contentJson) && post.contentJson.type === 'doc' && typeof post.contentJson.html === 'string') {
    return { type: 'doc', html: post.contentJson.html };
  }

  if (typeof post.contentHtml === 'string') return { type: 'doc', html: post.contentHtml };
  if (typeof post.contentMarkdown === 'string') return { type: 'doc', html: post.contentMarkdown };

  return { type: 'doc', html: '' };
};

const stringifyJsonLd = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
};

const apiPostToEditorInitialPost = (post: ApiPost): EditorInitialPost => {
  const contentJson = normalizeContentJson(post);
  const status = post.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

  return {
    id: post.id,
    slug: post.slug ?? '',
    title: post.title ?? '',
    h1: post.h1 ?? post.title ?? '',
    chapoHtml: post.chapoHtml ?? '',
    contentHtml: contentJson.html,
    contentJson,
    faqJson: toFaqItems(post.faqJson),
    coverImageId: post.coverImageId ?? post.coverImage?.id ?? '',
    coverImageUrl: post.coverImage?.url ?? post.heroImageUrl ?? '',
    coverImage: post.coverImage ?? null,
    heroImageUrl: post.heroImageUrl ?? post.coverImage?.url ?? '',
    heroImageAlt: post.heroImageAlt ?? '',
    metaTitle: post.metaTitle ?? post.seo?.title ?? '',
    metaDescription: post.metaDescription ?? post.seo?.description ?? '',
    canonicalUrl: post.canonicalUrl ?? post.seo?.canonicalUrl ?? '',
    robots: post.robots ?? (post.seo?.noIndex ? 'noindex,nofollow' : 'index,follow'),
    isActive: post.isActive ?? status === 'PUBLISHED',
    isIndexable: post.isIndexable ?? !post.seo?.noIndex,
    categoryId: post.categoryId ?? post.category?.id ?? '',
    categorySlug: post.categorySlug ?? post.category?.slug ?? '',
    tagsJson:
      toStringArray(post.tagsJson).length > 0
        ? toStringArray(post.tagsJson)
        : post.tags?.map((tag) => tag.slug ?? tag.name ?? '').filter(Boolean) ?? [],
    jsonLd: stringifyJsonLd(post.jsonLd),
    status,
    authorId: post.authorId ?? post.author?.id ?? '',
    author: post.author,
    locale: post.locale === 'fr' ? 'fr' : 'en',
    translationGroupId: post.translationGroupId ?? post.id ?? '',
    translations:
      post.translations
        ?.flatMap((translation) => {
          const locale = translation.locale === 'fr' ? 'fr' : translation.locale === 'en' ? 'en' : undefined;
          if (!locale || !translation.slug || !translation.path) return [];
          return [{ id: translation.id || undefined, locale, slug: translation.slug, path: translation.path, canonicalUrl: translation.canonicalUrl || undefined }];
        }) ?? []
  };
};

async function loadPostByIdOrSlug(idOrSlug: string): Promise<EditorInitialPost | undefined> {
  debugEditLoad('paramètre récupéré depuis l’URL', idOrSlug);

  try {
    const endpoint = `/admin-api/posts/${encodeURIComponent(idOrSlug)}`;
    debugEditLoad('endpoint détail appelé', endpoint);
    const payload = await adminApi.get<SinglePostResponse>(endpoint);
    debugEditLoad('réponse endpoint détail reçue', payload);
    const post = extractPost(payload);
    if (post) return apiPostToEditorInitialPost(post);
  } catch (error) {
    logEditLoadError('endpoint détail indisponible, fallback sur la liste', error);
  }

  const endpoint = '/admin-api/posts';
  debugEditLoad('endpoint liste appelé', endpoint);
  const payload = await adminApi.get<PostsListResponse>(endpoint);
  debugEditLoad('réponse endpoint liste reçue', payload);
  const current = extractPosts(payload).find((item) => item.id === idOrSlug || item.slug === idOrSlug);
  return current ? apiPostToEditorInitialPost(current) : undefined;
}

export default function AdminEditPostPage() {
  const params = useParams<{ id: string }>();
  const postId = params.id;
  const [post, setPost] = useState<EditorInitialPost | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadPost() {
      if (!postId) {
        setError('Identifiant d’article absent dans l’URL.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const loadedPost = await loadPostByIdOrSlug(postId);
        if (ignore) return;
        setPost(loadedPost);
        if (!loadedPost) setError('Article introuvable. Vérifiez que l’identifiant existe encore côté API.');
      } catch (e) {
        if (ignore) return;
        logEditLoadError('erreur chargement article', e);
        setPost(undefined);
        setError(e instanceof AdminApiError ? e.message : 'Impossible de charger cet article depuis l’API pour le moment.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadPost();

    return () => {
      ignore = true;
    };
  }, [postId]);

  return (
    <section>
      <h1 className="text-3xl font-bold">Modifier l&apos;article</h1>
      <p className="mt-2 text-slate-300">Édition complète avec publication et SEO.</p>
      {error ? <p className="mt-4 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">{error}</p> : null}
      <div className="mt-8">
        {loading ? <p>Chargement…</p> : post ? <PostEditorForm initialPost={post} /> : null}
      </div>
    </section>
  );
}
