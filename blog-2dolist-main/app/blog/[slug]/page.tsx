import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { ArticlePageView } from '@/components/blog/ArticlePageView';
import { contentRepository } from '@/lib/content/repository';
import { siteConfig } from '@/lib/site/config';
import { buildMissingPostMetadata, buildPostMetadata } from '@/lib/seo/post-metadata';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const requestedPath = `/blog/${slug}/`;
  const post = await contentRepository.getPostByPath(requestedPath, siteConfig.defaultLocale);
  return post ? buildPostMetadata(post) : buildMissingPostMetadata(requestedPath, siteConfig.defaultLocale);
}

export default async function LegacyBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await contentRepository.getPostByPath(`/blog/${slug}/`, siteConfig.defaultLocale);

  if (!post) permanentRedirect(`/articles/${slug}`);

  const [author, category, relatedPosts] = await Promise.all([
    contentRepository.getAuthorBySlugAndLocale(post.authorSlug, post.locale),
    contentRepository.getCategoryBySlugAndLocale(post.categorySlug, post.locale),
    contentRepository.getRelatedPosts(post, 3)
  ]);

  return <ArticlePageView post={post} author={author} category={category} relatedPosts={relatedPosts} />;
}
