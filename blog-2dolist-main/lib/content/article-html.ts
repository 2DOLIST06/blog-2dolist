import { addHeadingIds } from './headings.ts';

const emptyContainerRegex = /<(p|div)\b[^>]*>(?:\s|&nbsp;|&#160;|<br\s*\/?\s*>)*<\/\1>/gi;

export function stripWordPressBlockComments(contentHtml?: string | null) {
  return (contentHtml ?? '').replace(/<!--\s*\/?\s*wp:[\s\S]*?-->/gi, '');
}

/** Cleanup applied only by the article renderer. */
export function sanitizeArticleHtml(contentHtml?: string | null) {
  let html = stripWordPressBlockComments(contentHtml)
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/<h1\b/gi, '<h2')
    .replace(/<\/h1>/gi, '</h2>')
    .replace(/<img\b([^>]*)>/gi, (_tag, attributes: string) =>
      `<img${attributes.replace(/\s+style=(['"])[\s\S]*?\1/gi, '')}>`
    )
    .replace(/<([a-z][\w:-]*)\b([^>]*)>/gi, (_tag, tag: string, attributes: string) => {
      const cleanedAttributes = attributes.replace(/\s+style=(['"])([\s\S]*?)\1/gi, (style, _quote, value) =>
        value.includes('--tw-') ? '' : style
      );
      return `<${tag}${cleanedAttributes}>`;
    })
    .replace(/<span\b[^>]*>/gi, '')
    .replace(/<\/span>/gi, '');

  let previous: string;
  do {
    previous = html;
    html = html
      .replace(emptyContainerRegex, '')
      .replace(/<(p|div|h[1-6]|ul|ol|li|figure|figcaption|blockquote|strong|em|a)\b[^>]*>\s*<\/\1>/gi, '');
  } while (html !== previous);

  return addHeadingIds(html).trim();
}
