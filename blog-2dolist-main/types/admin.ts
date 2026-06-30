export type AdminPostStatus = 'draft' | 'published';

export interface AdminSeoFields {
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImage: string;
  noIndex: boolean;
}

export interface AdminPostDraft {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  coverImage: string;
  categorySlug: string;
  authorSlug: string;
  readingMinutes: number;
  tags: string[];
  relatedPostSlugs: string[];
  status: AdminPostStatus;
  publishedAt: string;
  updatedAt: string;
  sections: Array<{ heading: string; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
  seo: AdminSeoFields;
}
