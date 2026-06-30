import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AuthorBox } from '@/components/blog/AuthorBox';
import { FaqSection } from '@/components/blog/FaqSection';
import { PostCard } from '@/components/blog/PostCard';
import { RichContentRenderer } from '@/components/blog/RichContentRenderer';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { extractHeadingsFromHtml } from '@/lib/content/headings';
import { formatDate } from '@/lib/content/presenters';
import { contentRepository } from '@/lib/content/repository';
import { absoluteUrl, getArticlePath } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';
import { blogPostingJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';

export async function generateStaticParams() {
  const posts = await contentRepository.getAllPostsByLocale('fr');
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await contentRepository.getPostBySlugAndLocale(slug, 'fr');

  if (!post) {
    return buildMetadata({
      title: 'Article introuvable | Body Training Guide',
      description: "L’article demandé est introuvable.",
      path: getArticlePath('fr', slug),
      locale: 'fr',
      noIndex: true
    });
  }

  return buildMetadata({
    title: `${post.title} | Body Training Guide`,
    description: post.description,
    canonicalUrl: post.canonicalUrl,
    path: post.path ?? getArticlePath('fr', post.slug),
    locale: 'fr',
    hreflang: post.hreflang,
    image: post.coverImage,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    keywords: post.tags
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await contentRepository.getPostBySlugAndLocale(slug, 'fr');

  if (!post) notFound();

  const [author, category, relatedPosts] = await Promise.all([
    contentRepository.getAuthorBySlugAndLocale(post.authorSlug, 'fr'),
    contentRepository.getCategoryBySlugAndLocale(post.categorySlug, 'fr'),
    contentRepository.getRelatedPosts(post, 3)
  ]);

  const articleHeadings = extractHeadingsFromHtml(post.contentHtml);
  const articlePath = post.path ?? getArticlePath('fr', post.slug);
  const articleUrl = post.canonicalUrl ?? absoluteUrl(articlePath);
  const translation = post.translations?.find((item) => item.locale === 'en');
  const postJsonLd = blogPostingJsonLd({
    title: post.title,
    description: post.description,
    slug: post.slug,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    authorName: author?.name ?? 'Body Training Guide',
    category: category?.title ?? 'Musculation',
    locale: 'fr',
    url: articleUrl
  });

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Accueil', path: '/fr' },
    { name: 'Articles', path: '/fr/articles' },
    { name: post.title, path: articlePath }
  ]);

  return (
    <Container>
      <article className="py-10">
        <Breadcrumbs items={[{ label: 'Accueil', href: '/fr' }, { label: 'Articles', href: '/fr/articles' }, { label: post.title, href: articlePath }]} />

        <div className="mb-5">
          <Link href={translation?.path ?? '/articles'} className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
            Read in English
          </Link>
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-900">{post.title}</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">{post.description}</p>

        <div className="mt-5 text-sm text-slate-500">
          <span>{author?.name}</span> · <span>{formatDate(post.publishedAt, 'fr')}</span> · <span>{post.readingMinutes} min de lecture</span>
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

        {relatedPosts.length > 0 ? <section className="mt-14 border-t border-slate-200 pt-10"><h2 className="text-2xl font-bold">Articles liés</h2><div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{relatedPosts.map((relatedPost) => <PostCard key={relatedPost.slug} post={{ ...post, ...relatedPost, id: relatedPost.slug, locale: 'fr', path: getArticlePath('fr', relatedPost.slug), categorySlug: post.categorySlug, authorSlug: post.authorSlug, readingMinutes: 5, description: relatedPost.excerpt, tags: [], sections: [] }} category={category} author={author} />)}</div></section> : null}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      </article>
    </Container>
  );
}
