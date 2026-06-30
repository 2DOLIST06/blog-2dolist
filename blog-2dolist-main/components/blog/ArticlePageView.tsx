import Image from 'next/image';
import Link from 'next/link';
import { AuthorBox } from '@/components/blog/AuthorBox';
import { FaqSection } from '@/components/blog/FaqSection';
import { PostCard } from '@/components/blog/PostCard';
import { RichContentRenderer } from '@/components/blog/RichContentRenderer';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { extractHeadingsFromHtml } from '@/lib/content/headings';
import { formatDate } from '@/lib/content/presenters';
import { getPostHref } from '@/lib/content/urls';
import { absoluteUrl, getArticlesPath, getHomePath, type Locale } from '@/lib/i18n/routing';
import { blogPostingJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';
import type { Author, Category, Post, RelatedPostSummary } from '@/types/content';

interface ArticlePageViewProps {
  post: Post;
  author?: Author;
  category?: Category;
  relatedPosts: RelatedPostSummary[];
}

const labelsByLocale = {
  en: {
    home: 'Home',
    articles: 'Articles',
    readTranslation: 'Lire en français',
    reading: 'min read',
    related: 'Related articles',
    fallbackCategory: 'Category',
    translationFallback: '/fr/articles'
  },
  fr: {
    home: 'Accueil',
    articles: 'Articles',
    readTranslation: 'Read in English',
    reading: 'min de lecture',
    related: 'Articles liés',
    fallbackCategory: 'Catégorie',
    translationFallback: '/articles'
  }
} satisfies Record<Locale, Record<string, string>>;

export function ArticlePageView({ post, author, category, relatedPosts }: ArticlePageViewProps) {
  const labels = labelsByLocale[post.locale];
  const articleHeadings = extractHeadingsFromHtml(post.contentHtml);
  const articlePath = getPostHref(post, post.locale);
  const articleUrl = post.canonicalUrl ?? absoluteUrl(articlePath);
  const translationLocale: Locale = post.locale === 'fr' ? 'en' : 'fr';
  const translation = post.translations?.find((item) => item.locale === translationLocale);
  const translationHref = translation?.path ?? translation?.canonicalUrl ?? labels.translationFallback;

  const postJsonLd = blogPostingJsonLd({
    title: post.title,
    description: post.description,
    slug: post.slug,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    authorName: author?.name,
    category: category?.title ?? labels.fallbackCategory,
    locale: post.locale,
    url: articleUrl
  });

  const breadcrumbs = breadcrumbJsonLd([
    { name: labels.home, path: getHomePath(post.locale) },
    { name: labels.articles, path: getArticlesPath(post.locale) },
    { name: post.title, path: articlePath }
  ]);

  return (
    <Container>
      <article className="py-10">
        <Breadcrumbs items={[{ label: labels.home, href: getHomePath(post.locale) }, { label: labels.articles, href: getArticlesPath(post.locale) }, { label: post.title, href: articlePath }]} />

        <div className="mb-5">
          <Link href={translationHref} className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
            {labels.readTranslation}
          </Link>
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-900">{post.title}</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">{post.description}</p>

        <div className="mt-5 text-sm text-slate-500">
          <span>{author?.name}</span> · <span>{formatDate(post.publishedAt, post.locale)}</span> · <span>{post.readingMinutes} {labels.reading}</span>
        </div>

        <div className="relative mt-8 h-72 overflow-hidden rounded-2xl md:h-[420px]">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-8">
            {post.chapoHtml ? (
              <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50 px-6 py-5 text-lg leading-8 text-slate-800">
                <RichContentRenderer contentHtml={post.chapoHtml} />
              </div>
            ) : null}
            {post.contentHtml ? <RichContentRenderer contentHtml={post.contentHtml} /> : post.sections.map((section) => {
              const id = `${post.slug}-${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
              return <section key={section.heading} id={id}><h2 className="text-2xl font-semibold text-slate-900">{section.heading}</h2><div className="mt-3 space-y-4 leading-8 text-slate-700">{section.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>;
            })}
            <FaqSection faqs={post.faqJson ?? []} title="FAQ" />
            {author ? <AuthorBox author={author} /> : null}
          </div>
          <div className="lg:sticky lg:top-8 lg:self-start"><TableOfContents slug={post.slug} sections={post.sections} headings={articleHeadings} /></div>
        </div>

        {relatedPosts.length > 0 ? <section className="mt-14 border-t border-slate-200 pt-10"><h2 className="text-2xl font-bold">{labels.related}</h2><div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{relatedPosts.map((relatedPost) => <PostCard key={relatedPost.slug} post={{ ...post, ...relatedPost, id: relatedPost.slug, locale: post.locale, path: relatedPost.path, categorySlug: post.categorySlug, authorSlug: post.authorSlug, readingMinutes: 5, description: relatedPost.excerpt, tags: [], sections: [] }} category={category} author={author} />)}</div></section> : null}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      </article>
    </Container>
  );
}
