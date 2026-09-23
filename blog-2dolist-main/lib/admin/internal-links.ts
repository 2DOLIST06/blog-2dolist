export type LinkKind = 'internal' | 'external' | 'fragment' | 'mailto' | 'tel' | 'other';

export type LinkOccurrence = {
  anchor: string;
  href: string;
  kind: LinkKind;
  documentIndex: number;
};

export type LinkGroup = Omit<LinkOccurrence, 'documentIndex'> & {
  key: string;
  occurrenceIndexes: number[];
};

export const normalizeAnchor = (anchor: string) => anchor.replace(/\s+/g, ' ').trim();

export const classifyHref = (href: string): LinkKind => {
  const trimmed = href.trim();
  if (trimmed.startsWith('#')) return 'fragment';
  if (trimmed.toLowerCase().startsWith('mailto:')) return 'mailto';
  if (trimmed.toLowerCase().startsWith('tel:')) return 'tel';
  if (trimmed.startsWith('/')) return 'internal';
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return ['blog.2dolist.fr', '2dolist.fr', 'www.2dolist.fr'].includes(new URL(trimmed).hostname.toLowerCase()) ? 'internal' : 'external';
    } catch { return 'other'; }
  }
  return 'other';
};

const anchorLabel = (element: HTMLAnchorElement) => {
  const text = normalizeAnchor(element.textContent ?? '');
  if (text) return text;
  const image = element.querySelector('img');
  return image ? `[Image${image.alt.trim() ? ` : ${image.alt.trim()}` : ''}]` : '[Lien sans texte]';
};

export const collectLinkOccurrences = (root: ParentNode): LinkOccurrence[] =>
  Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href]')).map((element, documentIndex) => {
    const href = (element.getAttribute('href') ?? '').trim();
    return { anchor: anchorLabel(element), href, kind: classifyHref(href), documentIndex };
  });

export const linkGroupKey = (anchor: string, href: string) => `${anchor.length}:${anchor}\u0000${href}`;

export const groupLinkOccurrences = (occurrences: LinkOccurrence[]): LinkGroup[] => {
  const groups = new Map<string, LinkGroup>();
  for (const occurrence of occurrences) {
    const anchor = normalizeAnchor(occurrence.anchor);
    const href = occurrence.href.trim();
    const key = linkGroupKey(anchor, href);
    const current = groups.get(key);
    if (current) current.occurrenceIndexes.push(occurrence.documentIndex);
    else groups.set(key, { key, anchor, href, kind: classifyHref(href), occurrenceIndexes: [occurrence.documentIndex] });
  }
  return [...groups.values()];
};
