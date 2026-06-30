import { siteConfig } from '@/lib/constants';

export function BlogPostSeo({ post, path }: { post: { h1?: string; title: string; metaDescription?: string; chapoHtml?: string; heroImageUrl?: string; createdAt?: string; updatedAt?: string }; path: string }) {
  const auto = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.h1 || post.title, description: post.metaDescription || post.chapoHtml, image: post.heroImageUrl ? [post.heroImageUrl] : undefined, datePublished: post.createdAt, dateModified: post.updatedAt, mainEntityOfPage: `${siteConfig.baseUrl}${path}` };
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.baseUrl }, { '@type': 'ListItem', position: 2, name: 'Articles', item: `${siteConfig.baseUrl}/articles` }, { '@type': 'ListItem', position: 3, name: post.title, item: `${siteConfig.baseUrl}${path}` }] };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(auto) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} /></>;
}
