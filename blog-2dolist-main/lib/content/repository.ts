import { buildPublicApiUrl, getPublicApiBaseUrl } from '@/lib/api/env';
import { siteConfig, DEFAULT_LOCALE } from '@/lib/site/config';
import { getArticlePath, type Hreflang, type Locale } from '@/lib/i18n/routing';
import type { Author, Category, Post, PostFaq, PostSection, RelatedPostSummary } from '@/types/content';

interface ApiMedia {
  url?: string | null;
}

interface ApiSeo {
  description?: string | null;
}

interface ApiPost {
  id: string;
  slug: string;
  title: string;
  h1?: string | null;
  excerpt?: string | null;
  chapoHtml?: string | null;
  contentMarkdown?: string | null;
  contentHtml?: string | null;
  contentJson?: {
    html?: string | null;
    sections?: Array<{ heading?: string | null; content?: string | string[] | null }>;
  } | null;
  faqJson?: Array<{ question?: string | null; answer?: string | null }> | null;
  status?: string | null;
  isActive?: boolean | null;
  isIndexable?: boolean | null;
  metaDescription?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  readingTimeMinutes?: number | null;
  coverImage?: ApiMedia | null;
  heroImageUrl?: string | null;
  category?: { slug?: string | null } | null;
  categorySlug?: string | null;
  author?: { slug?: string | null } | null;
  authorSlug?: string | null;
  tags?: Array<{ slug?: string | null; name?: string | null }> | string[];
  tagsJson?: string[] | null;
  seo?: ApiSeo | null;
  locale?: Locale | null;
  translationGroupId?: string | null;
  path?: string | null;
  canonicalUrl?: string | null;
  translations?: Array<{ locale?: Locale | null; slug?: string | null; path?: string | null; canonicalUrl?: string | null }> | null;
  hreflang?: Array<{ hreflang?: Hreflang | null; href?: string | null }> | null;
}

interface ApiCategory {
  id: string;
  slug: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
}

interface ApiAuthor {
  id: string;
  slug: string;
  name: string;
  bio?: string | null;
  avatar?: ApiMedia | null;
}

const getPublicApiOrigin = () => {
  try {
    return new URL(getPublicApiBaseUrl()).origin;
  } catch {
    return getPublicApiBaseUrl().replace(/\/$/, '');
  }
};

const toAbsoluteApiAssetUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(trimmed)) return trimmed;

  const apiOrigin = getPublicApiOrigin();
  if (trimmed.startsWith('/')) return `${apiOrigin}${trimmed}`;
  if (/^(?:uploads|media|assets|files)\//i.test(trimmed)) return `${apiOrigin}/${trimmed}`;

  return trimmed;
};

const normalizeContentImageSources = (html: string) =>
  html.replace(/(<img\b[^>]*?\ssrc=["\'])([^"\']+)(["\'][^>]*>)/gi, (_match, before: string, src: string, after: string) => {
    return `${before}${toAbsoluteApiAssetUrl(src)}${after}`;
  });

const sortByDateDesc = (items: Post[]) =>
  [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

const normalizeParagraphs = (value: string | string[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value.map((paragraph) => paragraph.trim()).filter(Boolean);
  }

  if (typeof value !== 'string') return [];

  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
};

const markdownToSections = (markdown: string, fallbackTitle = 'Contenu'): PostSection[] => {
  const chunks = markdown
    .split(/^##\s+/gm)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length === 0) {
    return [{ heading: fallbackTitle, content: normalizeParagraphs(markdown) }];
  }

  return chunks.map((chunk, index) => {
    if (index === 0 && !markdown.trim().startsWith('## ')) {
      return {
        heading: fallbackTitle,
        content: normalizeParagraphs(chunk)
      };
    }

    const [headingLine, ...rest] = chunk.split('\n');
    return {
      heading: headingLine?.trim() || `${fallbackTitle} ${index + 1}`,
      content: normalizeParagraphs(rest.join('\n').trim())
    };
  });
};

const stripHtml = (value: string) =>
  value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

const toPostSections = (apiPost: ApiPost): PostSection[] => {
  const jsonSections =
    apiPost.contentJson?.sections
      ?.map((section, index) => ({
        heading: section.heading?.trim() || `Section ${index + 1}`,
        content: normalizeParagraphs(section.content)
      }))
      .filter((section) => section.content.length > 0) ?? [];

  if (jsonSections.length > 0) return jsonSections;
  if (apiPost.contentMarkdown?.trim()) return markdownToSections(stripHtml(apiPost.contentMarkdown), 'Contenu');
  if (apiPost.contentHtml?.trim()) return markdownToSections(stripHtml(apiPost.contentHtml), 'Contenu');
  if (apiPost.contentJson?.html?.trim()) return markdownToSections(stripHtml(apiPost.contentJson.html), 'Contenu');

  return [{ heading: 'Contenu', content: [apiPost.excerpt?.trim() || stripHtml(apiPost.chapoHtml ?? '') || 'Contenu bientôt disponible.'] }];
};

const getPostExcerpt = (apiPost: ApiPost) =>
  apiPost.excerpt?.trim() || stripHtml(apiPost.chapoHtml ?? '').slice(0, 280);

const getPostTags = (apiPost: ApiPost) => {
  if (apiPost.tagsJson?.length) return apiPost.tagsJson.map((tag) => tag.trim()).filter(Boolean);
  return (apiPost.tags ?? [])
    .map((tag) => (typeof tag === 'string' ? tag : tag.slug?.trim() || tag.name?.trim() || ''))
    .filter(Boolean);
};

const getPostContentHtml = (apiPost: ApiPost) => {
  const html = apiPost.contentHtml?.trim() || apiPost.contentJson?.html?.trim();
  return html ? normalizeContentImageSources(html) : undefined;
};

const getPostFaqs = (apiPost: ApiPost): PostFaq[] =>
  (apiPost.faqJson ?? [])
    .map((faq) => ({
      question: faq.question?.trim() || '',
      answer: faq.answer?.trim() || ''
    }))
    .filter((faq) => faq.question && faq.answer);

const toPost = (apiPost: ApiPost): Post => {
  const locale: Locale = apiPost.locale === 'fr' ? 'fr' : apiPost.locale === 'en' ? 'en' : DEFAULT_LOCALE;

  return ({
  id: apiPost.id,
  slug: apiPost.slug,
  title: apiPost.h1?.trim() || apiPost.title,
  excerpt: getPostExcerpt(apiPost),
  description:
    apiPost.seo?.description?.trim() ||
    apiPost.metaDescription?.trim() ||
    apiPost.excerpt?.trim() ||
    stripHtml(apiPost.chapoHtml ?? ''),
  coverImage: toAbsoluteApiAssetUrl(
    apiPost.coverImage?.url?.trim() ||
      apiPost.heroImageUrl?.trim() ||
      siteConfig.defaultOgImage
  ),
  publishedAt: apiPost.publishedAt || apiPost.updatedAt || new Date().toISOString(),
  updatedAt: apiPost.updatedAt || undefined,
  readingMinutes: apiPost.readingTimeMinutes ?? 6,
  categorySlug: apiPost.category?.slug?.trim() || apiPost.categorySlug?.trim() || 'non-classe',
  authorSlug: apiPost.author?.slug?.trim() || apiPost.authorSlug?.trim() || 'auteur-inconnu',
  tags: getPostTags(apiPost),
  sections: toPostSections(apiPost),
  contentHtml: getPostContentHtml(apiPost),
  chapoHtml: apiPost.chapoHtml?.trim() ? normalizeContentImageSources(apiPost.chapoHtml.trim()) : undefined,
  faqJson: getPostFaqs(apiPost),
  featured: false,
  locale,
  translationGroupId: apiPost.translationGroupId?.trim() || apiPost.id,
  path: apiPost.path?.trim() || getArticlePath(locale, apiPost.slug),
  canonicalUrl: apiPost.canonicalUrl?.trim() || undefined,
  translations: apiPost.translations
    ?.flatMap((translation) => {
      const translationLocale = translation.locale === 'fr' ? 'fr' : translation.locale === 'en' ? 'en' : undefined;
      const slug = translation.slug?.trim();
      const path = translation.path?.trim();
      const canonicalUrl = translation.canonicalUrl?.trim() || undefined;
      if (!translationLocale || (!canonicalUrl && !path && !slug)) return [];
      return [{ locale: translationLocale, slug, path, canonicalUrl }];
    }),
  hreflang: apiPost.hreflang
    ?.flatMap((item) => {
      if ((item.hreflang !== 'en' && item.hreflang !== 'fr' && item.hreflang !== 'x-default') || !item.href?.trim()) return [];
      return [{ hreflang: item.hreflang, href: item.href.trim() }];
    })
});
};

const toCategory = (category: ApiCategory): Category => ({
  id: category.id,
  slug: category.slug,
  title: category.title?.trim() || category.name?.trim() || 'Catégorie',
  description: category.description?.trim() || 'Découvrez tous les articles de cette catégorie.'
});

const toAuthor = (author: ApiAuthor): Author => ({
  id: author.id,
  slug: author.slug,
  name: author.name,
  role: 'Auteur',
  bio: author.bio?.trim() || 'Auteur.',
  avatar: author.avatar?.url?.trim() ? toAbsoluteApiAssetUrl(author.avatar.url.trim()) : siteConfig.defaultOgImage
});

async function fetchCollection<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(buildPublicApiUrl(path), {
      next: { revalidate: 60 }
    });

    if (!response.ok) return [];

    const payload = (await response.json().catch(() => ({}))) as {
      data?: unknown;
      docs?: unknown;
      items?: unknown;
      posts?: unknown;
      categories?: unknown;
      authors?: unknown;
    };

    const candidates = [payload.data, payload.docs, payload.items, payload.posts, payload.categories, payload.authors];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as T[];
      if (candidate && typeof candidate === 'object') {
        const nested = candidate as { docs?: unknown; items?: unknown; posts?: unknown; categories?: unknown; authors?: unknown };
        const nestedCandidates = [nested.docs, nested.items, nested.posts, nested.categories, nested.authors];
        for (const nestedCandidate of nestedCandidates) {
          if (Array.isArray(nestedCandidate)) return nestedCandidate as T[];
        }
      }
    }

    return [];
  } catch {
    return [];
  }
}

async function fetchPostByPath(path: string, locale: Locale = DEFAULT_LOCALE): Promise<ApiPost | null> {
  try {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const params = new URLSearchParams({ path: normalizedPath, locale });
    const response = await fetch(buildPublicApiUrl(`/api/posts/by-path?${params.toString()}`), {
      next: { revalidate: 60 }
    });
    if (!response.ok) return null;
    const payload = (await response.json().catch(() => ({}))) as {
      data?: unknown;
      post?: unknown;
    };

    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      const data = payload.data as { post?: unknown };
      if (data.post && typeof data.post === 'object' && !Array.isArray(data.post)) return data.post as ApiPost;
      return payload.data as ApiPost;
    }

    if (payload.post && typeof payload.post === 'object' && !Array.isArray(payload.post)) return payload.post as ApiPost;
    return null;
  } catch {
    return null;
  }
}

async function fetchPostBySlug(slug: string, locale: Locale = DEFAULT_LOCALE): Promise<ApiPost | null> {
  try {
    const response = await fetch(buildPublicApiUrl(`/api/posts/${slug}?locale=${locale}`), {
      next: { revalidate: 60 }
    });
    if (!response.ok) return null;
    const payload = (await response.json().catch(() => ({}))) as {
      data?: unknown;
      post?: unknown;
    };

    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      const data = payload.data as { post?: unknown };
      if (data.post && typeof data.post === 'object' && !Array.isArray(data.post)) {
        return data.post as ApiPost;
      }
      return payload.data as ApiPost;
    }

    if (payload.post && typeof payload.post === 'object' && !Array.isArray(payload.post)) {
      return payload.post as ApiPost;
    }

    return null;
  } catch {
    return null;
  }
}

export const contentRepository = {
  async getAllPostsByLocale(locale: Locale): Promise<Post[]> {
    const apiPosts = await fetchCollection<ApiPost>(`/api/posts?locale=${locale}&limit=50`);
    const publishedPosts = apiPosts
      .filter((post) => {
        const status = post.status?.toUpperCase();
        const isPublished = !status || status === 'PUBLISHED';
        return isPublished && post.isActive !== false;
      })
      .map(toPost);
    return sortByDateDesc(publishedPosts);
  },
  async getAllPosts(): Promise<Post[]> {
    return this.getAllPostsByLocale(DEFAULT_LOCALE);
  },
  async getFeaturedPostsByLocale(locale: Locale, limit = 3): Promise<Post[]> {
    const posts = await this.getAllPostsByLocale(locale);
    return posts.slice(0, limit);
  },
  async getFeaturedPosts(limit = 3): Promise<Post[]> {
    return this.getFeaturedPostsByLocale(DEFAULT_LOCALE, limit);
  },
  async getRecentPostsByLocale(locale: Locale, limit = 4): Promise<Post[]> {
    const posts = await this.getAllPostsByLocale(locale);
    return posts.slice(0, limit);
  },
  async getRecentPosts(limit = 4): Promise<Post[]> {
    return this.getRecentPostsByLocale(DEFAULT_LOCALE, limit);
  },
  async getPostByPath(path: string, locale: Locale = DEFAULT_LOCALE): Promise<Post | undefined> {
    const post = await fetchPostByPath(path, locale);
    if (!post || (post.status && post.status.toUpperCase() !== 'PUBLISHED') || post.isActive === false) return undefined;
    return toPost(post);
  },
  async getPostBySlugAndLocale(slug: string, locale: Locale): Promise<Post | undefined> {
    const post = await fetchPostBySlug(slug, locale);
    if (!post || (post.status && post.status.toUpperCase() !== 'PUBLISHED') || post.isActive === false) return undefined;
    return toPost(post);
  },
  async getPostBySlug(slug: string): Promise<Post | undefined> {
    return this.getPostBySlugAndLocale(slug, DEFAULT_LOCALE);
  },
  async getAllCategoriesByLocale(locale: Locale): Promise<Category[]> {
    const apiCategories = await fetchCollection<ApiCategory>(`/api/categories?locale=${locale}`);
    return apiCategories.map(toCategory);
  },
  async getAllCategories(): Promise<Category[]> {
    return this.getAllCategoriesByLocale(DEFAULT_LOCALE);
  },
  async getCategoryBySlugAndLocale(slug: string, locale: Locale): Promise<Category | undefined> {
    const categories = await this.getAllCategoriesByLocale(locale);
    return categories.find((category) => category.slug === slug);
  },
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return this.getCategoryBySlugAndLocale(slug, DEFAULT_LOCALE);
  },
  async getPostsByCategoryAndLocale(slug: string, locale: Locale): Promise<Post[]> {
    const apiPosts = await fetchCollection<ApiPost>(`/api/categories/${slug}/posts?locale=${locale}`);
    const postsFromCategoryEndpoint = apiPosts
      .filter((post) => {
        const status = post.status?.toUpperCase();
        return (!status || status === 'PUBLISHED') && post.isActive !== false;
      })
      .map(toPost);

    if (postsFromCategoryEndpoint.length > 0) return sortByDateDesc(postsFromCategoryEndpoint);

    const allPosts = await this.getAllPostsByLocale(locale);
    return sortByDateDesc(allPosts.filter((post) => post.categorySlug === slug));
  },
  async getPostsByCategory(slug: string): Promise<Post[]> {
    return this.getPostsByCategoryAndLocale(slug, DEFAULT_LOCALE);
  },
  async getAllAuthorsByLocale(locale: Locale): Promise<Author[]> {
    const apiAuthors = await fetchCollection<ApiAuthor>(`/api/authors?locale=${locale}`);
    return apiAuthors.map(toAuthor);
  },
  async getAllAuthors(): Promise<Author[]> {
    return this.getAllAuthorsByLocale(DEFAULT_LOCALE);
  },
  async getAuthorBySlugAndLocale(slug: string, locale: Locale): Promise<Author | undefined> {
    const authors = await this.getAllAuthorsByLocale(locale);
    return authors.find((author) => author.slug === slug);
  },
  async getAuthorBySlug(slug: string): Promise<Author | undefined> {
    return this.getAuthorBySlugAndLocale(slug, DEFAULT_LOCALE);
  },
  async getPostsByAuthorAndLocale(slug: string, locale: Locale): Promise<Post[]> {
    const apiPosts = await fetchCollection<ApiPost>(`/api/authors/${slug}/posts?locale=${locale}`);
    return sortByDateDesc(
      apiPosts
        .filter((post) => {
          const status = post.status?.toUpperCase();
          return (!status || status === 'PUBLISHED') && post.isActive !== false;
        })
        .map(toPost)
    );
  },
  async getPostsByAuthor(slug: string): Promise<Post[]> {
    return this.getPostsByAuthorAndLocale(slug, DEFAULT_LOCALE);
  },
  async getRelatedPosts(currentPost: Post, limit = 3): Promise<RelatedPostSummary[]> {
    const posts = (await this.getAllPostsByLocale(currentPost.locale)).filter((post) => post.categorySlug === currentPost.categorySlug);
    return posts
      .filter((post) => post.slug !== currentPost.slug)
      .slice(0, limit)
      .map((post) => ({
        slug: post.slug,
        path: post.path,
        title: post.title,
        excerpt: post.excerpt,
        coverImage: post.coverImage,
        publishedAt: post.publishedAt
      }));
  }
};
