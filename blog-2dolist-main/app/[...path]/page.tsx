import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticlePageView } from '@/components/blog/ArticlePageView';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/ui/Container';
import { withConfiguredLongCategoryCopy } from '@/lib/content/category-copy';
import { contentRepository } from '@/lib/content/repository';
import { siteConfig } from '@/lib/site/config';
import { buildMetadata } from '@/lib/seo/metadata';
import { buildMissingPostMetadata, buildPostMetadata } from '@/lib/seo/post-metadata';

const toPath = (segments: string[]) => `/${segments.join('/')}/`;

export async function generateMetadata({ params }: { params: Promise<{ path: string[] }> }): Promise<Metadata> {
  const { path } = await params;
  const requestedPath = toPath(path);
  if (path[0] === 'category') {
    const rawCategory = await contentRepository.getCategoryByPath(requestedPath, siteConfig.defaultLocale);
    if (!rawCategory) {
      return buildMetadata({
        title: `Catégorie introuvable | ${siteConfig.name}`,
        description: 'Catégorie indisponible.',
        path: requestedPath,
        locale: 'fr',
        noIndex: true
      });
    }
    const category = withConfiguredLongCategoryCopy(rawCategory);
    return buildMetadata({
      title: `${category.title} | Catégorie`,
      description: category.description,
      path: category.path ?? requestedPath,
      canonicalUrl: category.canonicalUrl,
      locale: 'fr'
    });
  }
  const post = await contentRepository.getPostByPath(requestedPath, siteConfig.defaultLocale);
  return post ? buildPostMetadata(post) : buildMissingPostMetadata(requestedPath, siteConfig.defaultLocale);
}

export default async function WordPressPathArticlePage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const requestedPath = toPath(path);
  if (path[0] === 'category') {
    const rawCategory = await contentRepository.getCategoryByPath(requestedPath, siteConfig.defaultLocale);
    if (!rawCategory) return notFound();

    const category = withConfiguredLongCategoryCopy(rawCategory);
    const [posts, authors] = await Promise.all([
      contentRepository.getPostsByCategoryAndLocale(category.slug, siteConfig.defaultLocale),
      contentRepository.getAllAuthorsByLocale(siteConfig.defaultLocale)
    ]);

    return (
      <Container>
        <section className="py-12">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{category.title}</h1>
          <p className="mt-2 max-w-2xl text-slate-600">{category.description}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} author={authors.find((author) => author.slug === post.authorSlug)} category={category} />
            ))}
          </div>
        </section>
      </Container>
    );
  }
  const post = await contentRepository.getPostByPath(requestedPath, siteConfig.defaultLocale);

  if (!post) return notFound();

  const [author, category, relatedPosts] = await Promise.all([
    contentRepository.getAuthorBySlugAndLocale(post.authorSlug, post.locale),
    contentRepository.getCategoryBySlugAndLocale(post.categorySlug, post.locale),
    contentRepository.getRelatedPosts(post, 3)
  ]);

  return <ArticlePageView post={post} author={author} category={category} relatedPosts={relatedPosts} />;
}
