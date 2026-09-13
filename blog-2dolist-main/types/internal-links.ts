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

