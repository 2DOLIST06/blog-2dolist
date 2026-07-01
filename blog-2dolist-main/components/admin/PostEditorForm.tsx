'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
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
  title: string;
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
  locale: Locale;
  translationGroupId: string;
  translations: TranslationSummary[];
};

type InitialPost = Partial<Omit<PostModel, 'status'>> & {
  status?: 'DRAFT' | 'PUBLISHED' | 'draft' | 'published';
  author?: { id?: string | null } | null;
  translations?: Array<{ id?: string | null; locale?: Locale | null; slug?: string | null; path?: string | null; canonicalUrl?: string | null }> | null;
  category?: { id?: string | null; slug?: string | null; title?: string | null; name?: string | null } | null;
  coverImage?: CoverImageValue;
};

type AuthorOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  slug: string;
  label: string;
};

const empty: PostModel = {
  slug: '',
  title: '',
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

type PostTranslationExport = {
  schema: 'blog.post-translation';
  version: 1;
  exportedAt: string;
  instructions: string;
  post: Omit<PostModel, 'id' | 'translations'>;
};

const exportablePostFields = [
  'slug',
  'title',
  'h1',
  'chapoHtml',
  'contentHtml',
  'contentJson',
  'faqJson',
  'coverImageId',
  'coverImageUrl',
  'heroImageUrl',
  'heroImageAlt',
  'metaTitle',
  'metaDescription',
  'canonicalUrl',
  'robots',
  'isActive',
  'isIndexable',
  'categoryId',
  'categorySlug',
  'tagsJson',
  'jsonLd',
  'status',
  'authorId',
  'locale',
  'translationGroupId'
] as const satisfies readonly (keyof Omit<PostModel, 'id' | 'translations'>)[];

type SavePostResponse = {
  data?: {
    id?: string;
    locale?: Locale | null;
    translationGroupId?: string | null;
    translations?: InitialPost['translations'];
  };
};

const serializePost = (value: PostModel) => JSON.stringify(value);

const buildTranslationExport = (post: PostModel): PostTranslationExport => {
  const exportedPost = Object.fromEntries(exportablePostFields.map((field) => [field, post[field]])) as Omit<PostModel, 'id' | 'translations'>;

  return {
    schema: 'blog.post-translation',
    version: 1,
    exportedAt: new Date().toISOString(),
    instructions:
      'Traduire uniquement les valeurs textuelles (slug, title, h1, chapoHtml, contentJson.html, faqJson, heroImageAlt, metaTitle, metaDescription, tagsJson, jsonLd, attributs alt/figcaption dans le HTML). Conserver la structure JSON, les clés, les IDs techniques, les URLs des images, les balises HTML et les booléens.',
    post: exportedPost
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeImportedPost = (payload: unknown): Partial<PostModel> => {
  const rawPost = isRecord(payload) && isRecord(payload.post) ? payload.post : payload;
  if (!isRecord(rawPost)) throw new Error('Le JSON doit contenir un objet post ou un objet article à la racine.');

  const next: Partial<PostModel> = {};
  for (const field of exportablePostFields) {
    if (field in rawPost) (next as Record<string, unknown>)[field] = rawPost[field];
  }

  if (next.locale !== undefined && next.locale !== 'fr' && next.locale !== 'en') throw new Error('La locale importée doit être "fr" ou "en".');
  if (next.status !== undefined && next.status !== 'DRAFT' && next.status !== 'PUBLISHED') throw new Error('Le status importé doit être "DRAFT" ou "PUBLISHED".');
  if (next.contentJson !== undefined && (!isRecord(next.contentJson) || next.contentJson.type !== 'doc' || typeof next.contentJson.html !== 'string')) {
    throw new Error('contentJson importé doit respecter le format { type: "doc", html: "..." }.');
  }
  if (next.faqJson !== undefined && !Array.isArray(next.faqJson)) throw new Error('faqJson importé doit être un tableau.');
  if (next.tagsJson !== undefined && !Array.isArray(next.tagsJson)) throw new Error('tagsJson importé doit être un tableau.');

  return next;
};

const getPostPath = (locale: Locale, slug: string) => (slug.trim() ? getArticlePath(locale, slug.trim()) : '');

const summarizeCurrentPost = (post: PostModel): TranslationSummary | undefined => {
  if (!post.id || !post.slug.trim()) return undefined;
  return {
    id: post.id,
    locale: post.locale,
    slug: post.slug.trim(),
    path: getPostPath(post.locale, post.slug),
    canonicalUrl: post.canonicalUrl || absoluteUrl(getPostPath(post.locale, post.slug))
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
    status,
    authorId: initialPost?.authorId || initialPost?.author?.id || '',
    categoryId: initialPost?.categoryId || initialPost?.category?.id || '',
    categorySlug: initialPost?.categorySlug || initialPost?.category?.slug || '',
    coverImageId: initialPost?.coverImageId || initialPost?.coverImage?.id || '',
    coverImageUrl,
    contentHtml,
    contentJson: { type: 'doc', html: contentHtml },
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
  const [translationExport, setTranslationExport] = useState('');
  const [translationImport, setTranslationImport] = useState('');
  const [translationToolNotice, setTranslationToolNotice] = useState('');
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
        authors?: Array<{ id?: string; name?: string }>;
        categories?: Array<{ id?: string; slug?: string; title?: string; name?: string }>;
      };
      const normalizedAuthors = payload.authors?.map((author) => ({ id: author.id ?? '', name: author.name ?? '' })).filter((author) => author.id && author.name) ?? [];
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

  const refreshTranslationExport = () => {
    setTranslationExport(JSON.stringify(buildTranslationExport(post), null, 2));
    setTranslationToolNotice('Export généré. Vous pouvez le copier dans ChatGPT ou le télécharger.');
  };

  const copyTranslationExport = async () => {
    const value = translationExport || JSON.stringify(buildTranslationExport(post), null, 2);
    setTranslationExport(value);
    await navigator.clipboard.writeText(value);
    setTranslationToolNotice('Export copié dans le presse-papiers.');
  };

  const downloadTranslationExport = () => {
    const value = translationExport || JSON.stringify(buildTranslationExport(post), null, 2);
    setTranslationExport(value);
    const blob = new Blob([value], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `article-${post.locale}-${post.slug || 'sans-slug'}-traduction.json`;
    link.click();
    URL.revokeObjectURL(url);
    setTranslationToolNotice('Fichier export téléchargé.');
  };

  const applyTranslationImport = (rawValue = translationImport) => {
    try {
      const importedFields = normalizeImportedPost(JSON.parse(rawValue));
      const nextPost: PostModel = {
        ...post,
        ...importedFields,
        id: post.id,
        translations: post.translations,
        contentHtml: importedFields.contentJson?.html ?? importedFields.contentHtml ?? post.contentHtml,
        contentJson: importedFields.contentJson ?? { type: 'doc', html: importedFields.contentHtml ?? post.contentJson.html },
        faqJson: importedFields.faqJson ?? post.faqJson,
        tagsJson: importedFields.tagsJson ?? post.tagsJson,
        coverImageUrl: importedFields.coverImageUrl || importedFields.heroImageUrl || post.coverImageUrl,
        status: importedFields.status ?? post.status,
        locale: importedFields.locale ?? post.locale
      };
      setPost(nextPost);
      setTranslationToolNotice('Import appliqué au formulaire. Vérifiez puis cliquez sur Enregistrer.');
      setError('');
    } catch (e) {
      setTranslationToolNotice('');
      setError(e instanceof Error ? e.message : 'Import JSON invalide.');
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      setError('');
      const normalizedTitle = post.title.trim();
      const normalizedSlug = post.slug.trim();
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
        title: normalizedTitle,
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
        publishedAt: publishing ? new Date().toISOString() : null
      };

      if (post.id) {
        await adminApi.put(`/admin-api/posts/${post.id}`, payload);
        const savedPost: PostModel = {
          ...post,
          slug: normalizedSlug,
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
  const publicUrl = post.slug.trim() ? absoluteUrl(getArticlePath('fr', post.slug.trim())) : '';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <input className={fieldClass} placeholder="Titre" value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} />
        <input className={fieldClass} placeholder="H1" value={post.h1} onChange={(e) => setPost({ ...post, h1: e.target.value })} />
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
        <div className="space-y-2">
          <p className={labelClass}>Langue</p>
          <p className="rounded border border-slate-700 p-2 text-sm text-slate-200">Français / fr</p>
        </div>
        <input className={fieldClass} placeholder="translationGroupId" value={post.translationGroupId} onChange={(e) => setPost({ ...post, translationGroupId: e.target.value })} />
        {publicUrl ? <p className="rounded border border-slate-700 p-2 text-xs text-slate-300">URL publique : {publicUrl}</p> : null}
        {post.translations.length > 0 ? (
          <div className="rounded border border-slate-700 p-3 text-xs text-slate-300">
            <p className="font-semibold text-slate-100">Traductions existantes</p>
            <ul className="mt-2 space-y-1">
              {post.translations.map((translation) => (
                <li key={`${translation.locale}-${translation.slug}`}>
                  {translation.locale} · {translation.id ? `${translation.id} · ` : ''}{translation.path}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {translationNotice ? <p className="rounded border border-amber-600 bg-amber-950/40 p-2 text-sm text-amber-100">{translationNotice}</p> : null}
        <section className="space-y-2 rounded border border-slate-700 p-3">
          <p className={labelClass}>Export / import traduction</p>
          <p className="text-xs text-slate-400">
            Exportez tous les champs traduisibles du formulaire (slug, H1, contenu HTML, FAQ, SEO, tags, alt des images, JSON-LD), faites traduire le JSON, puis importez-le ici.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button type="button" className={secondaryButtonClass} onClick={refreshTranslationExport}>Générer</button>
            <button type="button" className={secondaryButtonClass} onClick={copyTranslationExport}>Copier</button>
            <button type="button" className={secondaryButtonClass} onClick={downloadTranslationExport}>Télécharger</button>
          </div>
          <textarea
            className={`${fieldClass} min-h-40 font-mono text-xs`}
            placeholder="Export JSON à envoyer à ChatGPT"
            value={translationExport}
            onChange={(e) => setTranslationExport(e.target.value)}
          />
          <textarea
            className={`${fieldClass} min-h-40 font-mono text-xs`}
            placeholder="Collez ici le JSON traduit renvoyé par ChatGPT"
            value={translationImport}
            onChange={(e) => setTranslationImport(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondaryButtonClass} onClick={() => applyTranslationImport()} disabled={!translationImport.trim()}>Importer le JSON collé</button>
            <button type="button" className={secondaryButtonClass} onClick={() => importFileRef.current?.click()}>Importer un fichier</button>
            <input
              ref={importFileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = '';
                if (!file) return;
                const value = await file.text();
                setTranslationImport(value);
                applyTranslationImport(value);
              }}
            />
          </div>
          {translationToolNotice ? <p className="text-xs text-emerald-300">{translationToolNotice}</p> : null}
        </section>
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
  );
}
