import { siteConfig } from '@/lib/constants';
import { absoluteUrl, getArticlePath, type Locale } from '@/lib/i18n/routing';

export const blogPostingJsonLd = (props: {
  title: string;
  description: string;
  slug: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  category: string;
  locale?: Locale;
  url?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: props.title,
  description: props.description,
  image: `${props.image}`,
  datePublished: props.datePublished,
  dateModified: props.dateModified ?? props.datePublished,
  articleSection: props.category,
  inLanguage: props.locale ?? 'en',
  author: {
    '@type': 'Person',
    name: props.authorName
  },
  publisher: {
    '@type': 'Organization',
    name: siteConfig.name
  },
  mainEntityOfPage: props.url ?? absoluteUrl(getArticlePath(props.locale ?? 'en', props.slug))
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path)
  }))
});
