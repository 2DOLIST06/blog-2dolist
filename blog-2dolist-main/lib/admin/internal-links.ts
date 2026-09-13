export type LinkKind = 'internal' | 'external' | 'fragment' | 'mailto' | 'other';

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
  if (href.startsWith('#')) return 'fragment';
  if (href.toLowerCase().startsWith('mailto:')) return 'mailto';
  if (href.startsWith('/')) return 'internal';
  if (/^https?:\/\//i.test(href)) return 'external';
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

