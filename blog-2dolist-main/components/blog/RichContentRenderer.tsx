import { sanitizeArticleHtml, stripWordPressBlockComments } from '@/lib/content/article-html';
import { addMissingHeadingIds } from '@/lib/content/headings';

export { sanitizeArticleHtml, stripWordPressBlockComments } from '@/lib/content/article-html';

/**
 * Gutenberg stores block boundaries as HTML comments alongside the actual HTML.
 * They are editor metadata, so remove only comments whose marker starts with
 * `wp:` and leave every element (and unrelated HTML comment) untouched.
 */
export function RichContentRenderer({ contentHtml }: { contentHtml?: string | null }) {
  const cleaned = addMissingHeadingIds(
    stripWordPressBlockComments(contentHtml).replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
  );

  return <div className="rich-content" dangerouslySetInnerHTML={{ __html: cleaned }} />;
}

export function ArticleRichContentRenderer({ contentHtml }: { contentHtml?: string | null }) {
  return <div className="rich-content" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(contentHtml) }} />;
}
