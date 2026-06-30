import { addMissingHeadingIds } from '@/lib/content/headings';

export function RichContentRenderer({ contentHtml }: { contentHtml?: string | null }) {
  const cleaned = addMissingHeadingIds(
    (contentHtml ?? '').replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
  );

  return <div className="rich-content" dangerouslySetInnerHTML={{ __html: cleaned }} />;
}
