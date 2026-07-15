import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticlePageView } from '@/components/blog/ArticlePageView';
import { getAdminAuthMode, getAdminJwtFromCookies } from '@/lib/admin/auth';
import { contentRepository } from '@/lib/content/repository';
import { buildMissingPostMetadata, buildPostMetadata } from '@/lib/seo/post-metadata';

export async function generateStaticParams() {
  const posts = await contentRepository.getAllPostsByLocale('fr');
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await contentRepository.getPostBySlugAndLocale(slug, 'fr');
  return post ? buildPostMetadata(post) : buildMissingPostMetadata(slug, 'fr');
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await contentRepository.getPostBySlugAndLocale(slug, 'fr');

  if (!post) return notFound();

  const [author, category, relatedPosts, adminJwt] = await Promise.all([
    contentRepository.getAuthorBySlugAndLocale(post.authorSlug, 'fr'),
    contentRepository.getCategoryBySlugAndLocale(post.categorySlug, 'fr'),
    contentRepository.getRelatedPosts(post, 3),
    getAdminJwtFromCookies()
  ]);
  const canEdit = getAdminAuthMode() === 'dev-bypass' || Boolean(adminJwt);

  return <ArticlePageView post={post} author={author} category={category} relatedPosts={relatedPosts} canEdit={canEdit} />;
}
