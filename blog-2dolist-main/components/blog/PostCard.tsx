import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/content/presenters';
import { getCategoryHref, getPostHref } from '@/lib/content/urls';
import { Badge } from '@/components/ui/Badge';
import type { Author, Category, Post } from '@/types/content';

interface PostCardProps {
  post: Post;
  category?: Category;
  author?: Author;
  href?: string;
  maxExcerptLength?: number;
}

const truncateExcerpt = (excerpt: string, maxLength?: number) => {
  if (!maxLength || excerpt.length <= maxLength) return excerpt;

  const shortened = excerpt.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 0 ? lastSpace : undefined).trimEnd()}…`;
};

export function PostCard({ post, category, author, href, maxExcerptLength }: PostCardProps) {
  const articleHref = href ?? getPostHref(post);
  const byline = 'Équipe éditoriale';
  const readingLabel = 'min de lecture';
  const excerpt = truncateExcerpt(
    post.excerpt?.trim() ||
    post.description?.trim() ||
    'Un guide pour comprendre les bases du sujet et mieux organiser les informations essentielles.',
    maxExcerptLength
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Link href={articleHref}>
        <div className="relative h-52 w-full">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
        </div>
      </Link>
      <div className="p-5">
        {category ? <Link href={getCategoryHref(category, post.locale)}><Badge>{category.title}</Badge></Link> : null}
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
