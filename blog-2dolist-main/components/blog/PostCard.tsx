import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/content/presenters';
import { getPostHref } from '@/lib/content/urls';
import { Badge } from '@/components/ui/Badge';
import type { Author, Category, Post } from '@/types/content';

interface PostCardProps {
  post: Post;
  category?: Category;
  author?: Author;
  href?: string;
}

export function PostCard({ post, category, author, href }: PostCardProps) {
  const articleHref = href ?? getPostHref(post);
  const byline = post.locale === 'fr' ? 'Équipe éditoriale' : 'Editorial team';
  const readingLabel = post.locale === 'fr' ? 'min de lecture' : 'min read';
  const excerpt =
    post.excerpt?.trim() ||
    post.description?.trim() ||
    (post.locale === 'fr'
      ? 'Un guide pour comprendre les bases du sujet et mieux organiser les informations essentielles.'
      : 'A guide to understand the basics of the topic and organize the key information more effectively.');

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Link href={articleHref}>
        <div className="relative h-52 w-full">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
        </div>
      </Link>
      <div className="p-5">
        {category ? <Badge>{category.title}</Badge> : null}
        <h3 className="mt-3 text-lg font-semibold text-slate-900">
          <Link href={articleHref}>{post.title}</Link>
        </h3>
        <p className="mt-2 text-sm text-slate-600">{excerpt}</p>
        <div className="mt-4 text-xs text-slate-500">
          <span>{author?.name ?? byline}</span> · <span>{formatDate(post.publishedAt, post.locale)}</span> ·{' '}
          <span>{post.readingMinutes} {readingLabel}</span>
        </div>
      </div>
    </article>
  );
}
