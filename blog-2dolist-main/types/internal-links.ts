export type InternalLinkType = 'post' | 'category' | 'static-page';

export type InternalLinkDestination = {
  id: string;
  type: InternalLinkType;
  title: string;
  slug?: string;
  href: string;
  locale: 'fr';
  category?: { id: string; slug: string; title: string };
  source: 'blog' | 'main-site';
};

export type InternalLinkCategoryOption = { id: string; slug: string; label: string };

export type LinkingPage = {
  id: string;
  type: InternalLinkType;
  title: string;
  url: string;
  locale: 'fr';
  category?: { id: string; slug: string; title: string };
  incomingCount: number;
  outgoingCount: number;
  incoming: LinkingRelation[];
  outgoing: LinkingRelation[];
};

export type LinkingRelation = {
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceType: InternalLinkType;
  destinationId?: string;
  destinationTitle?: string;
  destinationUrl: string;
  destinationType?: InternalLinkType;
  anchor: string;
  href: string;
  locale: 'fr';
  occurrences: number;
};
