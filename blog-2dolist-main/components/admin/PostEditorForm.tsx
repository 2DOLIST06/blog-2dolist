'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminApiError, adminApi, uploadAdminImage } from '@/lib/admin/api-client';
import { absoluteUrl, getArticlePath, type Locale } from '@/lib/i18n/routing';
import { RichContentEditor, type RichContentValue } from '@/components/admin/RichContentEditor';

type FaqItem = { question: string; answer: string };

type CoverImageValue = { id?: string | null; url?: string | null } | null;

type TranslationSummary = { id?: string; locale: Locale; slug: string; path: string; canonicalUrl?: string };

type PostModel = {
  id?: string;
  slug: string;
  path: string;
  title: string;
  oldUrl: string;
  excerpt: string;
  h1: string;
  chapoHtml: string;
  contentHtml: string;
  contentJson: RichContentValue;
  faqJson: FaqItem[];
  coverImageId: string;
  coverImageUrl: string;
  heroImageUrl: string;
  heroImageAlt: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robots: string;
  isActive: boolean;
  isIndexable: boolean;
  categoryId: string;
  categorySlug: string;
  tagsJson: string[];
  jsonLd: string;
  status: 'DRAFT' | 'PUBLISHED';
  authorId: string;
  publishedAt: string;
  updatedAt: string;
  locale: Locale;
  translationGroupId: string;
  translations: TranslationSummary[];
};

type InitialPost = Partial<Omit<PostModel, 'status'>> & {
  old_url?: string | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'draft' | 'published';
  author?: { id?: string | null } | null;
  translations?: Array<{ id?: string | null; locale?: Locale | null; slug?: string | null; path?: string | null; canonicalUrl?: string | null }> | null;
  category?: { id?: string | null; slug?: string | null; title?: string | null; name?: string | null } | null;
  coverImage?: CoverImageValue;
};

type AuthorOption = {
  id: string;
  name: string;
  slug: string;
};

type CategoryOption = {
  id: string;
  slug: string;
  label: string;
};

const empty: PostModel = {
  slug: '',
  path: '',
  title: '',
  oldUrl: '',
  excerpt: '',
  h1: '',
  chapoHtml: '',
  contentHtml: '',
  contentJson: { type: 'doc', html: '' },
  faqJson: [],
  coverImageId: '',
  coverImageUrl: '',
  heroImageUrl: '',
  heroImageAlt: '',
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  robots: 'index,follow',
  isActive: false,
  isIndexable: false,
  categoryId: '',
  categorySlug: '',
  tagsJson: [],
  jsonLd: '',
  status: 'DRAFT',
  authorId: '',
  publishedAt: '',
  updatedAt: '',
  locale: 'fr',
  translationGroupId: '',
  translations: []
};

const fieldClass =
  'w-full rounded border border-slate-600 bg-white p-2 text-slate-950 placeholder:text-slate-500 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';
const labelClass = 'block text-sm font-medium text-slate-200';
const checkboxClass = 'h-4 w-4 rounded border-slate-500 bg-white text-brand-700 accent-brand-700';
const secondaryButtonClass =
  'rounded border border-slate-600 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60';

type ArticleJson = {
  old_url?: string;
  path: string;
  slug: string;
  locale: 'fr';
  status?: 'DRAFT' | 'PUBLISHED';
  isActive?: boolean;
  isIndexable?: boolean;
  title: string;
  h1: string;
  excerpt: string;
  chapoHtml: string;
  contentHtml: string;
  contentJson: RichContentValue;
  faqJson: FaqItem[];
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robots: string;
  publishedAt: string;
  updatedAt: string;
  categoryName: string;
  categorySlug: string;
  authorName: string;
  authorSlug: string;
  coverImageUrl: string;
  coverImageAlt: string;
  tags: string[];
};

type ValidatedImport = { article?: ArticleJson; errors: string[]; warnings: string[] };

type SavePostResponse = {
  data?: {
    id?: string;
    locale?: Locale | null;
    translationGroupId?: string | null;
    translations?: InitialPost['translations'];
  };
};

const serializePost = (value: PostModel) => JSON.stringify(value);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const stringValue = (value: unknown) => (typeof value === 'string' ? value : '');

const contentBlocksToHtml = (value: Record<string, unknown>) =>
  Array.isArray(value.blocks)
    ? value.blocks.map((block) => (isRecord(block) && typeof block.html === 'string' ? block.html : '')).join('')
    : '';

const validateArticleJson = (payload: unknown, categories: CategoryOption[], authors: AuthorOption[]): ValidatedImport => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isRecord(payload)) return { errors: ['Le JSON doit contenir un objet article à la racine.'], warnings };

  const path = stringValue(payload.path);
  const slug = stringValue(payload.slug);
  const title = stringValue(payload.title);
  if (!path) errors.push('path est obligatoire.');
  else if (!path.startsWith('/')) errors.push('path doit commencer par /.');
  else if (path === '/fr' || path.startsWith('/fr/')) errors.push('path ne doit jamais commencer par /fr.');
  if (!slug) errors.push('slug est obligatoire.');
  if (!title) errors.push('title est obligatoire.');
  if (payload.locale !== undefined && payload.locale !== 'fr') errors.push('locale doit être absente ou égale à "fr".');
  if (!stringValue(payload.contentHtml) && !isRecord(payload.contentJson)) errors.push('contentHtml ou contentJson est obligatoire.');
  if (payload.contentJson !== undefined && !isRecord(payload.contentJson)) errors.push('contentJson doit être un objet.');
  if (payload.status !== undefined && payload.status !== 'DRAFT' && payload.status !== 'PUBLISHED') errors.push('status doit être DRAFT ou PUBLISHED.');
  if (payload.tags !== undefined && (!Array.isArray(payload.tags) || payload.tags.some((tag) => typeof tag !== 'string'))) errors.push('tags doit être un tableau de chaînes.');
  if (payload.faqJson !== undefined && (!Array.isArray(payload.faqJson) || payload.faqJson.some((faq) => !isRecord(faq) || typeof faq.question !== 'string' || typeof faq.answer !== 'string'))) {
    errors.push('faqJson doit être un tableau d’objets question/answer.');
  }
  const canonicalUrl = stringValue(payload.canonicalUrl);
  if (canonicalUrl) {
    try {
      if (new URL(canonicalUrl).pathname !== path) errors.push('canonicalUrl doit utiliser exactement le path de l’article.');
    } catch {
      errors.push('canonicalUrl doit être une URL absolue valide.');
    }
  }
  const categorySlug = stringValue(payload.categorySlug);
  const authorSlug = stringValue(payload.authorSlug);
  if (categorySlug && !categories.some((category) => category.slug === categorySlug)) warnings.push(`La catégorie « ${categorySlug} » n’existe pas dans les options. Créez-la dans l’admin avant la sauvegarde.`);
  if (authorSlug && !authors.some((author) => author.slug === authorSlug)) warnings.push(`L’auteur « ${authorSlug} » n’existe pas dans les options. Créez-le dans l’admin avant la sauvegarde.`);
  if (errors.length) return { errors, warnings };

  const importedContent = isRecord(payload.contentJson) ? payload.contentJson : {};
  const contentHtml = stringValue(payload.contentHtml) || stringValue(importedContent.html) || contentBlocksToHtml(importedContent);
  const contentJson = { ...importedContent, type: 'doc' as const, html: contentHtml } as RichContentValue;
  return {
    errors,
    warnings,
    article: {
      old_url: stringValue(payload.old_url) || undefined,
      path,
      slug,
      locale: 'fr',
      status: payload.status === 'PUBLISHED' || payload.status === 'DRAFT' ? payload.status : undefined,
      isActive: typeof payload.isActive === 'boolean' ? payload.isActive : undefined,
      isIndexable: typeof payload.isIndexable === 'boolean' ? payload.isIndexable : undefined,
      title,
      h1: stringValue(payload.h1), excerpt: stringValue(payload.excerpt), chapoHtml: stringValue(payload.chapoHtml),
      contentHtml, contentJson,
      faqJson: (payload.faqJson as FaqItem[] | undefined) ?? [],
      metaTitle: stringValue(payload.metaTitle), metaDescription: stringValue(payload.metaDescription), canonicalUrl,
      robots: stringValue(payload.robots) || 'index,follow', publishedAt: stringValue(payload.publishedAt), updatedAt: stringValue(payload.updatedAt),
      categoryName: stringValue(payload.categoryName), categorySlug,
      authorName: stringValue(payload.authorName), authorSlug,
      coverImageUrl: stringValue(payload.coverImageUrl), coverImageAlt: stringValue(payload.coverImageAlt),
      tags: (payload.tags as string[] | undefined) ?? []
    }
  };
};

const getPostPath = (post: Pick<PostModel, 'path' | 'locale' | 'slug'>) =>
  post.path.trim() || (post.slug.trim() ? getArticlePath(post.locale, post.slug.trim()) : '');

const summarizeCurrentPost = (post: PostModel): TranslationSummary | undefined => {
  if (!post.id || !post.slug.trim()) return undefined;
  return {
    id: post.id,
    locale: post.locale,
    slug: post.slug.trim(),
    path: getPostPath(post),
    canonicalUrl: post.canonicalUrl || absoluteUrl(getPostPath(post))
  };
};

const mergeTranslations = (translations: TranslationSummary[], next?: TranslationSummary) => {
  const indexed = new Map<string, TranslationSummary>();
  for (const translation of translations) indexed.set(translation.locale, translation);
  if (next) indexed.set(next.locale, next);
  return Array.from(indexed.values());
};

const normalizeInitialPost = (initialPost?: InitialPost): PostModel => {
  const status = initialPost?.status?.toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
  const contentHtml = initialPost?.contentJson?.html || initialPost?.contentHtml || '';
  const coverImageUrl = initialPost?.coverImageUrl || initialPost?.coverImage?.url || initialPost?.heroImageUrl || '';

  return {
    ...empty,
    ...(initialPost ?? {}),
    oldUrl: initialPost?.oldUrl || initialPost?.old_url || '',
    status,
    authorId: initialPost?.authorId || initialPost?.author?.id || '',
    categoryId: initialPost?.categoryId || initialPost?.category?.id || '',
    categorySlug: initialPost?.categorySlug || initialPost?.category?.slug || '',
    coverImageId: initialPost?.coverImageId || initialPost?.coverImage?.id || '',
    coverImageUrl,
    contentHtml,
    contentJson: initialPost?.contentJson ? { ...initialPost.contentJson, html: contentHtml } : { type: 'doc', html: contentHtml },
    isActive: initialPost?.isActive ?? status === 'PUBLISHED',
    isIndexable: initialPost?.isIndexable ?? status === 'PUBLISHED',
    locale: 'fr',
    translationGroupId: initialPost?.translationGroupId || initialPost?.id || '',
    translations:
      initialPost?.translations
        ?.flatMap((translation) => {
          const locale = translation.locale === 'fr' ? 'fr' : translation.locale === 'en' ? 'en' : undefined;
          if (!locale || !translation.slug || !translation.path) return [];
          return [{ id: translation.id || undefined, locale, slug: translation.slug, path: translation.path, canonicalUrl: translation.canonicalUrl || undefined }];
        }) ?? []
  };
};

export function PostEditorForm({ initialPost }: { initialPost?: InitialPost }) {
  const [post, setPost] = useState<PostModel>(() => normalizeInitialPost(initialPost));
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [error, setError] = useState('');
  const [coverUploadError, setCoverUploadError] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [translationNotice, setTranslationNotice] = useState('');
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonValue, setJsonValue] = useState('');
  const [jsonValidation, setJsonValidation] = useState<ValidatedImport>({ errors: [], warnings: [] });
  const [jsonNotice, setJsonNotice] = useState('');
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(() => serializePost(normalizeInitialPost(initialPost)));
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!initialPost) return;
    const normalized = normalizeInitialPost(initialPost);
    setPost(normalized);
    setSavedSnapshot(serializePost(normalized));
    setTranslationNotice('');
  }, [initialPost]);

  useEffect(() => {
    if (initialPost) return;
    const locale = searchParams.get('locale') === 'fr' ? 'fr' : undefined;
    const translationGroupId = searchParams.get('translationGroupId') || '';
    const authorId = searchParams.get('authorId') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const categorySlug = searchParams.get('categorySlug') || '';
    const coverImageId = searchParams.get('coverImageId') || '';
    const heroImageUrl = searchParams.get('heroImageUrl') || '';
    if (!locale && !translationGroupId) return;
    const nextPost = {
      ...empty,
      locale: locale ?? empty.locale,
      translationGroupId,
      authorId,
      categoryId,
      categorySlug,
      coverImageId,
      heroImageUrl,
      coverImageUrl: heroImageUrl,
      status: 'DRAFT' as const,
      isActive: false,
      isIndexable: false
    };
    setPost(nextPost);
    setSavedSnapshot(serializePost(nextPost));
  }, [initialPost, searchParams]);

  useEffect(() => {
    async function loadOptions() {
      const response = await fetch('/admin-api/content/options', { cache: 'no-store' });
      if (!response.ok) return;
      const payload = (await response.json().catch(() => ({}))) as {
        authors?: Array<{ id?: string; name?: string; slug?: string }>;
        categories?: Array<{ id?: string; slug?: string; title?: string; name?: string }>;
      };
      const normalizedAuthors = payload.authors?.map((author) => ({ id: author.id ?? '', name: author.name ?? '', slug: author.slug ?? '' })).filter((author) => author.id && author.name) ?? [];
      const normalizedCategories =
        payload.categories
          ?.map((category) => ({
            id: category.id ?? '',
            slug: category.slug ?? '',
            label: category.title?.trim() || category.name?.trim() || category.slug || ''
          }))
          .filter((category) => category.id && category.slug && category.label) ?? [];
      setAuthors(normalizedAuthors);
      setCategories(normalizedCategories);
    }

    void loadOptions();
  }, []);

  const uploadEditorImage = useCallback(async (file: File) => {
    const uploaded = await uploadAdminImage(file, 'editor');
    return { url: uploaded.url, alt: '' };
  }, []);

  const uploadCoverImage = async (file?: File) => {
    setCoverUploadError('');

    if (!file) {
      setCoverUploadError('Aucun fichier image principale sélectionné.');
      return;
    }

    try {
      setCoverUploading(true);
      const uploaded = await uploadAdminImage(file, 'cover');
      setPost((current) => ({ ...current, coverImageId: uploaded.id, coverImageUrl: uploaded.url }));
    } catch (e) {
      setCoverUploadError(e instanceof AdminApiError || e instanceof Error ? e.message : 'Upload de l’image principale impossible.');
    } finally {
      setCoverUploading(false);
    }
  };

  const hasUnsavedChanges = useMemo(() => serializePost(post) !== savedSnapshot, [post, savedSnapshot]);

  const switchLocale = (targetLocale: Locale) => {
    if (targetLocale === post.locale) return;
    if (hasUnsavedChanges && !window.confirm('Vous avez des changements non sauvegardés. Changer de langue les abandonnera. Continuer ?')) return;

    const existingTranslation = post.translations.find((translation) => translation.locale === targetLocale);
    if (existingTranslation) {
      const editId = existingTranslation.id || existingTranslation.slug;
      if (!editId) {
        setError('La traduction existe mais son identifiant est absent de la réponse API.');
        return;
      }
      router.push(`/admin/posts/${encodeURIComponent(editId)}`);
      return;
    }

    const sourceSummary = summarizeCurrentPost(post);
    const nextPost: PostModel = {
      ...empty,
      id: undefined,
      locale: targetLocale,
      translationGroupId: post.translationGroupId || post.id || '',
      authorId: post.authorId,
      categoryId: post.categoryId,
      categorySlug: post.categorySlug,
      coverImageId: post.coverImageId,
      coverImageUrl: post.coverImageUrl,
      heroImageUrl: post.heroImageUrl,
      heroImageAlt: post.heroImageAlt,
      tagsJson: post.tagsJson,
      status: 'DRAFT',
      isActive: false,
      isIndexable: false,
      translations: mergeTranslations(post.translations, sourceSummary)
    };

    setPost(nextPost);
    setSavedSnapshot(serializePost(nextPost));
    setError('');
    setTranslationNotice(`La version ${targetLocale.toUpperCase()} n’existe pas encore. Elle sera créée à la première sauvegarde.`);
  };

  const buildArticleExport = (): ArticleJson => {
    const category = categories.find((item) => item.id === post.categoryId || item.slug === post.categorySlug);
    const author = authors.find((item) => item.id === post.authorId);
    return {
      ...(post.oldUrl ? { old_url: post.oldUrl } : {}),
      path: post.path,
      slug: post.slug,
      locale: 'fr',
      status: post.status,
      isActive: post.isActive,
      isIndexable: post.isIndexable,
      title: post.title,
      h1: post.h1,
      excerpt: post.excerpt,
      chapoHtml: post.chapoHtml,
      contentHtml: post.contentHtml,
      contentJson: post.contentJson,
      faqJson: post.faqJson,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      canonicalUrl: post.canonicalUrl,
      robots: post.robots,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      categoryName: category?.label ?? '',
      categorySlug: category?.slug ?? post.categorySlug,
      authorName: author?.name ?? '',
      authorSlug: author?.slug ?? '',
      coverImageUrl: post.coverImageUrl || post.heroImageUrl,
      coverImageAlt: post.heroImageAlt,
      tags: post.tagsJson
    };
  };

  const openExport = () => {
    setJsonValue(JSON.stringify(buildArticleExport(), null, 2));
    setJsonValidation({ errors: [], warnings: [] });
    setJsonNotice('Export généré depuis les valeurs actuelles du formulaire.');
    setJsonModalOpen(true);
  };

  const openImport = () => {
    setJsonValue('');
    setJsonValidation({ errors: [], warnings: [] });
    setJsonNotice('');
    setJsonModalOpen(true);
  };

  const validateImport = (raw = jsonValue): ValidatedImport => {
    try {
      const result = validateArticleJson(JSON.parse(raw), categories, authors);
      setJsonValidation(result);
      setJsonNotice(result.errors.length ? '' : 'JSON valide. Vous pouvez maintenant l’appliquer.');
      return result;
    } catch {
      const result: ValidatedImport = { errors: ['JSON invalide : vérifiez la syntaxe.'], warnings: [] };
      setJsonValidation(result);
      setJsonNotice('');
      return result;
    }
  };

  const applyArticleImport = () => {
    const result = validateImport();
    if (!result.article || result.errors.length) return;
    const article = result.article;
    const category = categories.find((item) => item.slug === article.categorySlug);
    const author = authors.find((item) => item.slug === article.authorSlug);
    setPost((current) => ({
      ...current,
      oldUrl: article.old_url ?? '', path: article.path, slug: article.slug, locale: 'fr', status: article.status ?? current.status,
      isActive: article.isActive ?? current.isActive, isIndexable: article.isIndexable ?? current.isIndexable, title: article.title, h1: article.h1,
      excerpt: article.excerpt, chapoHtml: article.chapoHtml, contentHtml: article.contentHtml, contentJson: article.contentJson,
      faqJson: article.faqJson, metaTitle: article.metaTitle, metaDescription: article.metaDescription,
      canonicalUrl: article.canonicalUrl, robots: article.robots, publishedAt: article.publishedAt, updatedAt: article.updatedAt,
      categoryId: category?.id ?? '', categorySlug: article.categorySlug,
      authorId: author?.id ?? '', coverImageUrl: article.coverImageUrl, heroImageUrl: article.coverImageUrl,
      heroImageAlt: article.coverImageAlt, tagsJson: article.tags
    }));
    setJsonNotice('Import appliqué sans sauvegarde. Relisez le formulaire puis cliquez sur Enregistrer.');
  };

  const downloadJson = () => {
    const blob = new Blob([jsonValue], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `article-${post.slug || 'sans-slug'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError('');
      const normalizedTitle = post.title.trim();
      const normalizedSlug = post.slug.trim();
      const normalizedPath = getPostPath(post);
      const normalizedContent = (post.contentJson.html || post.contentHtml || '').trim();
      const normalizedAuthorId = post.authorId.trim();
      const selectedCategory = categories.find((category) => category.id === post.categoryId || category.slug === post.categorySlug);
      const normalizedCategoryId = (post.categoryId || selectedCategory?.id || '').trim();
      const normalizedCategorySlug = (post.categorySlug || selectedCategory?.slug || '').trim();

      if (normalizedTitle.length < 4) {
        setError('Le titre doit contenir au moins 4 caractères.');
        return;
      }
      if (normalizedContent.length < 10) {
        setError('Le contenu doit contenir au moins 10 caractères.');
        return;
      }
      if (!normalizedAuthorId) {
        setError('Veuillez sélectionner un auteur.');
        return;
      }

      let parsedJsonLd: unknown = null;
      if (post.jsonLd.trim()) parsedJsonLd = JSON.parse(post.jsonLd);
      const publishing = post.status === 'PUBLISHED';
      const payload = {
        slug: normalizedSlug || undefined,
        path: normalizedPath || undefined,
        title: normalizedTitle,
        old_url: post.oldUrl || null,
        excerpt: post.excerpt || null,
        locale: post.locale,
        translationGroupId: post.translationGroupId || null,
        contentMarkdown: normalizedContent,
        authorId: normalizedAuthorId,
        h1: post.h1 || normalizedTitle,
        chapoHtml: post.chapoHtml || null,
        contentHtml: post.contentJson.html || null,
        contentJson: post.contentJson,
        faqJson: post.faqJson,
        coverImageId: post.coverImageId || null,
        heroImageUrl: post.heroImageUrl || null,
        heroImageAlt: post.heroImageAlt || null,
        metaTitle: post.metaTitle || null,
        metaDescription: post.metaDescription || null,
        canonicalUrl: post.canonicalUrl || null,
        robots: post.robots,
        isActive: publishing ? true : post.isActive,
        isIndexable: publishing ? true : post.isIndexable,
        categoryId: normalizedCategoryId || null,
        categorySlug: normalizedCategorySlug || null,
        tagsJson: post.tagsJson,
        jsonLd: parsedJsonLd,
        status: post.status,
        publishedAt: publishing ? post.publishedAt || new Date().toISOString() : null
      };

      if (post.id) {
        await adminApi.put(`/admin-api/posts/${post.id}`, payload);
        const savedPost: PostModel = {
          ...post,
          slug: normalizedSlug,
          path: normalizedPath,
          title: normalizedTitle,
          h1: post.h1 || normalizedTitle,
          chapoHtml: post.chapoHtml,
          contentHtml: post.contentJson.html,
          authorId: normalizedAuthorId,
          isActive: publishing ? true : post.isActive,
          isIndexable: publishing ? true : post.isIndexable,
          categoryId: normalizedCategoryId,
          categorySlug: normalizedCategorySlug,
          id: post.id
        };
        setPost(savedPost);
        setSavedSnapshot(serializePost(savedPost));
        router.refresh();
      } else {
        const response = await adminApi.post<SavePostResponse>('/admin-api/posts', payload);
        const createdId = response.data?.id;
        if (!createdId) throw new AdminApiError('Réponse création invalide: data.id est requis.', 502, response);
        const createdLocale = response.data?.locale === 'fr' ? 'fr' : response.data?.locale === 'en' ? 'en' : post.locale;
        const savedPost = {
          ...post,
          id: createdId,
          locale: createdLocale,
          translationGroupId: response.data?.translationGroupId || post.translationGroupId,
          translations: response.data?.translations ? normalizeInitialPost({ translations: response.data.translations }).translations : post.translations
        };
        setPost(savedPost);
        setSavedSnapshot(serializePost(savedPost));
        setTranslationNotice('');
        router.replace(`/admin/posts/${encodeURIComponent(createdId)}`);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const warning = useMemo(() => (!post.isIndexable || !post.isActive) && post.robots === 'index,follow', [post]);
  const selectedCategory = categories.find((category) => category.id === post.categoryId || category.slug === post.categorySlug);
  const categorySelectValue = selectedCategory?.id || post.categoryId || post.categorySlug;
  const coverPreviewUrl = post.coverImageUrl || post.heroImageUrl;
  const publicPath = getPostPath(post);
  const publicUrl = publicPath ? absoluteUrl(publicPath) : '';

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className={secondaryButtonClass} onClick={openImport}>Importer JSON</button>
        <button type="button" className={secondaryButtonClass} onClick={openExport}>Exporter JSON</button>
      </div>
      {jsonModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="article-json-title">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg border border-slate-600 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 id="article-json-title" className="text-xl font-semibold">Import / export JSON article</h2>
              <button type="button" className={secondaryButtonClass} onClick={() => setJsonModalOpen(false)}>Fermer</button>
            </div>
            <p className="mt-2 text-sm text-slate-300">Le HTML est traité comme du texte et n’est jamais exécuté pendant l’import.</p>
            <textarea className={`${fieldClass} mt-4 min-h-80 font-mono text-xs`} value={jsonValue} onChange={(event) => { setJsonValue(event.target.value); setJsonValidation({ errors: [], warnings: [] }); setJsonNotice(''); }} spellCheck={false} />
            {jsonValidation.errors.length ? <ul className="mt-3 list-disc pl-5 text-sm text-red-400">{jsonValidation.errors.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            {jsonValidation.warnings.length ? <ul className="mt-3 list-disc pl-5 text-sm text-amber-400">{jsonValidation.warnings.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            {jsonNotice ? <p className="mt-3 text-sm text-emerald-300">{jsonNotice}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => validateImport()}>Valider</button>
              <button type="button" className="rounded bg-brand-700 px-3 py-2 text-sm text-white" onClick={applyArticleImport}>Appliquer</button>
              <button type="button" className={secondaryButtonClass} onClick={() => void navigator.clipboard.writeText(jsonValue)}>Copier</button>
              <button type="button" className={secondaryButtonClass} onClick={downloadJson}>Télécharger .json</button>
              <input ref={importFileRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void file.text().then(setJsonValue); event.currentTarget.value = ''; }} />
              <button type="button" className={secondaryButtonClass} onClick={() => importFileRef.current?.click()}>Choisir un fichier</button>
            </div>
          </div>
        </div>
      ) : null}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <input className={fieldClass} placeholder="Titre" value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} />
        <input className={fieldClass} placeholder="H1" value={post.h1} onChange={(e) => setPost({ ...post, h1: e.target.value })} />
        <textarea className={fieldClass} placeholder="Résumé court" value={post.excerpt} onChange={(e) => setPost({ ...post, excerpt: e.target.value })} />
        <textarea className={fieldClass} placeholder="Chapo HTML" value={post.chapoHtml} onChange={(e) => setPost({ ...post, chapoHtml: e.target.value })} />
        <RichContentEditor value={post.contentJson} onChange={(v) => setPost({ ...post, contentJson: v, contentHtml: v.html })} onUploadImage={uploadEditorImage} />
        <section className="rounded border border-slate-700 p-3">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => setPost({ ...post, faqJson: [...post.faqJson, { question: '', answer: '' }] })}
          >
            Ajouter question
          </button>
          <div className="mt-3 space-y-3">
            {post.faqJson.map((faq, i) => (
              <div key={i} className="space-y-2">
                <input
                  className={fieldClass}
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => setPost({ ...post, faqJson: post.faqJson.map((f, idx) => (idx === i ? { ...f, question: e.target.value } : f)) })}
                />
                <textarea
                  className={fieldClass}
                  placeholder="Réponse"
                  value={faq.answer}
                  onChange={(e) => setPost({ ...post, faqJson: post.faqJson.map((f, idx) => (idx === i ? { ...f, answer: e.target.value } : f)) })}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-3">
        <input className={fieldClass} placeholder="slug" value={post.slug} onChange={(e) => setPost({ ...post, slug: e.target.value })} />
        <input
          className={fieldClass}
          placeholder="path WordPress (ex. /2024/03/26/mon-article/)"
          value={post.path}
          onChange={(e) => setPost({ ...post, path: e.target.value })}
        />
        <div className="space-y-2">
          <p className={labelClass}>Langue</p>
          <p className="rounded border border-slate-700 p-2 text-sm text-slate-200">Français / fr</p>
        </div>
        <input className={fieldClass} placeholder="translationGroupId" value={post.translationGroupId} onChange={(e) => setPost({ ...post, translationGroupId: e.target.value })} />
        {publicUrl ? (
          <div className="space-y-2 rounded border border-slate-700 p-2 text-xs text-slate-300">
            <p>URL publique : {publicUrl}</p>
            <Link
              href={publicPath}
              className="inline-flex rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-white"
            >
              Voir l’activité sur le site
            </Link>
          </div>
        ) : null}
        <label className={labelClass} htmlFor="post-author">
          Auteur
        </label>
        <select id="post-author" className={fieldClass} value={post.authorId} onChange={(e) => setPost({ ...post, authorId: e.target.value })}>
          <option value="">Sélectionner un auteur</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>
        <label className={labelClass} htmlFor="post-category">
          Catégorie
        </label>
        <select
          id="post-category"
          className={fieldClass}
          value={categorySelectValue}
          onChange={(e) => {
            const selected = categories.find((category) => category.id === e.target.value || category.slug === e.target.value);
            setPost({ ...post, categoryId: selected?.id ?? '', categorySlug: selected?.slug ?? e.target.value });
          }}
        >
          <option value="">Sélectionner une catégorie</option>
          {!selectedCategory && post.categorySlug ? <option value={post.categorySlug}>{post.categorySlug}</option> : null}
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        {post.categorySlug ? <p className="text-xs text-slate-400">Slug catégorie envoyé : {post.categorySlug}</p> : null}
        <input
          className={fieldClass}
          placeholder="tags séparés virgules"
          value={post.tagsJson.join(',')}
          onChange={(e) => setPost({ ...post, tagsJson: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
        />
        <section className="space-y-2 rounded border border-slate-700 p-3">
          <label className={labelClass} htmlFor="cover-image-file">
            Image principale officielle
          </label>
          <input
            id="cover-image-file"
            className={fieldClass}
            type="file"
            accept="image/*"
            disabled={coverUploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = '';
              await uploadCoverImage(file);
            }}
          />
          <p className="text-xs text-slate-400">Le fichier est envoyé au backend, puis la réponse S3/CloudFront est enregistrée via coverImageId.</p>
          {post.coverImageId ? <p className="text-xs text-emerald-300">coverImageId sélectionné : {post.coverImageId}</p> : null}
          {coverPreviewUrl ? (
            <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
              <Image src={coverPreviewUrl} alt={post.heroImageAlt || post.title || 'Prévisualisation image principale'} width={288} height={128} className="h-32 w-full object-cover" unoptimized />
            </div>
          ) : null}
          {coverUploading ? <p className="text-xs text-slate-300">Upload de l’image principale en cours…</p> : null}
          {coverUploadError ? <p className="text-sm text-red-500">{coverUploadError}</p> : null}
        </section>
        <input className={fieldClass} placeholder="heroImageUrl (compatibilité anciennes données)" value={post.heroImageUrl} onChange={(e) => setPost({ ...post, heroImageUrl: e.target.value, coverImageUrl: post.coverImageUrl || e.target.value })} />
        <input className={fieldClass} placeholder="heroImageAlt" value={post.heroImageAlt} onChange={(e) => setPost({ ...post, heroImageAlt: e.target.value })} />
        <input className={fieldClass} placeholder="metaTitle" value={post.metaTitle} onChange={(e) => setPost({ ...post, metaTitle: e.target.value })} />
        <textarea className={fieldClass} placeholder="metaDescription" value={post.metaDescription} onChange={(e) => setPost({ ...post, metaDescription: e.target.value })} />
        <input className={fieldClass} placeholder="canonicalUrl" value={post.canonicalUrl} onChange={(e) => setPost({ ...post, canonicalUrl: e.target.value })} />
        <input className={fieldClass} placeholder="robots" value={post.robots} onChange={(e) => setPost({ ...post, robots: e.target.value })} />
        <textarea className={fieldClass} placeholder="jsonLd objet/array" value={post.jsonLd} onChange={(e) => setPost({ ...post, jsonLd: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-slate-100">
          <input className={checkboxClass} type="checkbox" checked={post.isActive} onChange={(e) => setPost({ ...post, isActive: e.target.checked })} /> actif
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-100">
          <input className={checkboxClass} type="checkbox" checked={post.isIndexable} onChange={(e) => setPost({ ...post, isIndexable: e.target.checked })} /> indexable
        </label>
        <select
          className={fieldClass}
          value={post.status}
          onChange={(e) => {
            const status = e.target.value as 'DRAFT' | 'PUBLISHED';
            setPost({ ...post, status, isActive: status === 'PUBLISHED' ? true : post.isActive, isIndexable: status === 'PUBLISHED' ? true : post.isIndexable, robots: status === 'PUBLISHED' ? 'index,follow' : post.robots });
          }}
        >
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
        </select>
        <p className="text-xs text-slate-400">Un article publié est automatiquement envoyé comme actif et indexable pour apparaître sur /articles.</p>
        {warning ? <p className="text-sm text-amber-500">Avertissement: robots index,follow incohérent avec visibilité.</p> : null}
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button type="button" className="rounded bg-brand-700 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60" onClick={save} disabled={saving || coverUploading}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </aside>
    </div>
    </>
  );
}
