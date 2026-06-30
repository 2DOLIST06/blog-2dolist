import Link from 'next/link';
import type { ArticleHeading } from '@/lib/content/headings';
import type { PostSection } from '@/types/content';

type TableOfContentsProps = {
  slug: string;
  sections?: PostSection[];
  headings?: ArticleHeading[];
};

function sectionToHeading(slug: string, section: PostSection): ArticleHeading {
  return {
    id: `${slug}-${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    text: section.heading,
    level: 2
  };
}

export function TableOfContents({ slug, sections = [], headings }: TableOfContentsProps) {
  const items = headings?.length ? headings : sections.map((section) => sectionToHeading(slug, section));

  if (!items.length) return null;

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">Sommaire</p>
      <ul className="mt-2 space-y-2 text-sm text-slate-600">
        {items.map((item, index) => (
          <li key={`${item.id}-${index}`} style={{ paddingLeft: `${Math.max(item.level - 2, 0) * 0.75}rem` }}>
            <Link href={`#${item.id}`} className="hover:text-slate-900">
              {item.text}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
