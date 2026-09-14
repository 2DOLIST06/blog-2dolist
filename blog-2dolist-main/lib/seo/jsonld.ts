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
  authorUrl?: string;
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
  dateModified: getValidModifiedDate(props.datePublished, props.dateModified),
  articleSection: props.category,
  inLanguage: props.locale ?? 'fr',
  author: {
    '@type': 'Person',
    name: props.authorName,
    ...(props.authorUrl ? { url: props.authorUrl } : {})
  },
  publisher: {
    '@type': 'Organization',
    name: siteConfig.name
  },
  mainEntityOfPage: props.url ?? absoluteUrl(getArticlePath(props.locale ?? 'fr', props.slug))
});

export const getValidModifiedDate = (published: string, modified?: string) => {
  if (!modified) return published;
  const publishedTime = Date.parse(published);
  const modifiedTime = Date.parse(modified);
  return Number.isNaN(publishedTime) || Number.isNaN(modifiedTime) || modifiedTime < publishedTime ? published : modified;
};

export const faqPageJsonLd = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer }
  }))
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
