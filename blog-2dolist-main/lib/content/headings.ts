export interface ArticleHeading {
  id: string;
  text: string;
  level: number;
}

const headingTagRegex = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
const idAttributeRegex = /\sid=(['"])(.*?)\1/i;
const tagRegex = /<[^>]+>/g;

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function getHeadingText(innerHtml: string) {
  return decodeHtmlEntities(innerHtml.replace(tagRegex, ' ')).replace(/\s+/g, ' ').trim();
}

function slugifyHeading(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function getUniqueId(baseId: string, usedIds: Map<string, number>) {
  const count = usedIds.get(baseId) ?? 0;
  usedIds.set(baseId, count + 1);
  return count === 0 ? baseId : `${baseId}-${count + 1}`;
}

export function extractHeadingsFromHtml(contentHtml?: string | null): ArticleHeading[] {
  const usedIds = new Map<string, number>();
  const headings: ArticleHeading[] = [];

  for (const match of (contentHtml ?? '').matchAll(headingTagRegex)) {
    const level = Number(match[1]);
    const attributes = match[2] ?? '';
    const innerHtml = match[3] ?? '';
    const text = getHeadingText(innerHtml);

    if (!text) continue;

    const existingId = attributes.match(idAttributeRegex)?.[2];
    const id = existingId || getUniqueId(slugifyHeading(text), usedIds);
    if (existingId) usedIds.set(existingId, (usedIds.get(existingId) ?? 0) + 1);
    headings.push({ id, text, level });
  }

  return headings;
}

export function addMissingHeadingIds(contentHtml?: string | null) {
  const usedIds = new Map<string, number>();

  return (contentHtml ?? '').replace(headingTagRegex, (fullMatch, level: string, attributes: string, innerHtml: string) => {
    const text = getHeadingText(innerHtml);

    if (!text) return fullMatch;

    const existingId = attributes.match(idAttributeRegex)?.[2];
    if (existingId) {
      getUniqueId(existingId, usedIds);
      return fullMatch;
    }

    const id = getUniqueId(slugifyHeading(text), usedIds);
    return `<h${level}${attributes} id="${id}">${innerHtml}</h${level}>`;
  });
}
