import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticlePageView } from '@/components/blog/ArticlePageView';
import { contentRepository } from '@/lib/content/repository';
import { buildMissingPostMetadata, buildPostMetadata } from '@/lib/seo/post-metadata';

const toPath = (segments: string[]) => `/${segments.join('/')}/`;

export async function generateMetadata({ params }: { params: Promise<{ path: string[] }> }): Promise<Metadata> {
  const { path } = await params;
  const requestedPath = toPath(path);
  const post = await contentRepository.getPostByPath(requestedPath, 'en');
  return post ? buildPostMetadata(post) : buildMissingPostMetadata(requestedPath, 'en');
}

export default async function WordPressPathArticlePage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const requestedPath = toPath(path);
  const post = await contentRepository.getPostByPath(requestedPath, 'en');

  if (!post) return notFound();

  const [author, category, relatedPosts] = await Promise.all([
    contentRepository.getAuthorBySlugAndLocale(post.authorSlug, 'en'),
    contentRepository.getCategoryBySlugAndLocale(post.categorySlug, 'en'),
    contentRepository.getRelatedPosts(post, 3)
  ]);

  return <ArticlePageView post={post} author={author} category={category} relatedPosts={relatedPosts} />;
}
