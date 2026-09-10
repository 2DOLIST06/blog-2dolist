import { addMissingHeadingIds } from '@/lib/content/headings';

/**
 * Gutenberg stores block boundaries as HTML comments alongside the actual HTML.
 * They are editor metadata, so remove only comments whose marker starts with
 * `wp:` and leave every element (and unrelated HTML comment) untouched.
 */
export function stripWordPressBlockComments(contentHtml?: string | null) {
  return (contentHtml ?? '').replace(/<!--\s*\/?\s*wp:[\s\S]*?-->/gi, '');
}

export function RichContentRenderer({ contentHtml }: { contentHtml?: string | null }) {
  const cleaned = addMissingHeadingIds(
    stripWordPressBlockComments(contentHtml).replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
  );

  return <div className="rich-content" dangerouslySetInnerHTML={{ __html: cleaned }} />;
}
