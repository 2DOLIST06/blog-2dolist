import type { Hreflang, Locale } from '@/lib/i18n/routing';

export interface Author {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  socials?: {
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
}

export interface Category {
  id: string;
  slug: string;
  title: string;
  description: string;
}

export interface PostSection {
  heading: string;
  content: string[];
}

export interface PostFaq {
  question: string;
  answer: string;
}

export interface PostTranslation {
  locale: Locale;
  slug: string;
  path: string;
  canonicalUrl?: string;
}

export interface PostHreflang {
  hreflang: Hreflang;
  href: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  coverImage: string;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  categorySlug: string;
  authorSlug: string;
  tags: string[];
  sections: PostSection[];
  contentHtml?: string;
  chapoHtml?: string;
  faqJson?: PostFaq[];
  featured?: boolean;
  locale: Locale;
  translationGroupId: string;
  path?: string;
  canonicalUrl?: string;
  translations?: PostTranslation[];
  hreflang?: PostHreflang[];
}

export interface RelatedPostSummary {
  slug: string;
  path?: string;
  title: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string;
}

export interface NavigationItem {
  label: string;
  href: string;
}
