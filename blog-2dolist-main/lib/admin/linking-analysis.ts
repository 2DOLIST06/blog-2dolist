import type { InternalLinkType, LinkingPage, LinkingRelation } from '../../types/internal-links.ts';

export const BLOG_ORIGIN = 'https://blog.2dolist.fr';
export const MAIN_ORIGIN = 'https://2dolist.fr';
const INTERNAL_HOSTS = new Map([
  ['blog.2dolist.fr', 'blog.2dolist.fr'],
  ['2dolist.fr', '2dolist.fr'],
  ['www.2dolist.fr', '2dolist.fr']
]);

export type AnalysisPageInput = {
  id: string;
  type: InternalLinkType;
  title: string;
  url: string;
  html?: string;
  locale: 'fr';
  category?: { id: string; slug: string; title: string };
};

export type ExtractedHtmlLink = { anchor: string; href: string };

const decodeHtml = (value: string) => value
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;|&#34;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');

export const htmlToSearchableText = (html: string) => decodeHtml(html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
  .replace(/<[^>]*>/g, ' '))
  .replace(/\s+/g, ' ')
  .trim();

export const contentIncludes = (title: string, html: string, query: string) => {
  const needle = query.trim().toLocaleLowerCase('fr');
  if (!needle) return true;
  return `${title} ${htmlToSearchableText(html)}`.toLocaleLowerCase('fr').includes(needle);
};

export const extractLinksFromHtml = (html: string): ExtractedHtmlLink[] => {
  const links: ExtractedHtmlLink[] = [];
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi;
  for (const match of html.matchAll(anchorPattern)) {
    const attributes = match[1] ?? '';
    const hrefMatch = attributes.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i);
    if (!hrefMatch) continue;
    const href = decodeHtml(hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? '').trim();
    if (!href) continue;
    const imageAlt = (match[2] ?? '').match(/<img\b[^>]*\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const text = decodeHtml((match[2] ?? '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
    const alt = decodeHtml(imageAlt?.[1] ?? imageAlt?.[2] ?? '').trim();
    links.push({ anchor: text || (alt ? `[Image : ${alt}]` : '[Lien sans texte]'), href });
  }
  return links;
};

export const normalizeInternalUrl = (href: string): string | undefined => {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#') || /^(?:mailto|tel|javascript|data):/i.test(trimmed) || trimmed.startsWith('//')) return;
  let url: URL;
  try { url = new URL(trimmed, BLOG_ORIGIN); } catch { return; }
  const host = INTERNAL_HOSTS.get(url.hostname.toLowerCase());
  if (!host || (url.protocol !== 'http:' && url.protocol !== 'https:')) return;
  let pathname = url.pathname.replace(/\/{2,}/g, '/');
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
  return `https://${host}${pathname || '/'}`;
};

export const analyzeInternalLinking = (inputs: AnalysisPageInput[]): LinkingPage[] => {
  const pages = inputs.map((page) => ({ ...page, normalizedUrl: normalizeInternalUrl(page.url) }));
  const byUrl = new Map(pages.flatMap((page) => page.normalizedUrl ? [[page.normalizedUrl, page] as const] : []));
  const relations: LinkingRelation[] = [];

  for (const source of pages) {
    const grouped = new Map<string, LinkingRelation>();
    for (const link of extractLinksFromHtml(source.html ?? '')) {
      const normalized = normalizeInternalUrl(link.href);
      if (!normalized) continue;
      const destination = byUrl.get(normalized);
      const key = `${normalized}\u0000${link.anchor}`;
      const existing = grouped.get(key);
      if (existing) { existing.occurrences += 1; continue; }
      grouped.set(key, {
        sourceId: source.id, sourceTitle: source.title, sourceUrl: source.url, sourceType: source.type,
        destinationId: destination?.id, destinationTitle: destination?.title,
        destinationUrl: destination?.url ?? normalized, destinationType: destination?.type,
        anchor: link.anchor, href: link.href, locale: source.locale, occurrences: 1
      });
    }
    relations.push(...grouped.values());
  }

  return pages.map(({ normalizedUrl: _normalizedUrl, html: _html, ...page }) => {
    const outgoing = relations.filter((relation) => relation.sourceId === page.id);
    const incoming = relations.filter((relation) => relation.destinationId === page.id);
    return {
      ...page,
      incoming,
      outgoing,
      incomingCount: incoming.reduce((total, relation) => total + relation.occurrences, 0),
      outgoingCount: outgoing.reduce((total, relation) => total + relation.occurrences, 0)
    };
  });
};
