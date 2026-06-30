import type { Metadata } from 'next';
import { CategoryCard } from '@/components/blog/CategoryCard';
import { NewsletterCta } from '@/components/blog/NewsletterCta';
import { PostCard } from '@/components/blog/PostCard';
import { SectionHeading } from '@/components/blog/SectionHeading';
import { Container } from '@/components/ui/Container';
import { withConfiguredShortCategoryCopy } from '@/lib/content/category-copy';
import { contentRepository } from '@/lib/content/repository';
import { absoluteUrl } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site/config';

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.name,
  url: absoluteUrl('/fr'),
  inLanguage: 'fr',
  description: siteConfig.description
};

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: siteConfig.defaultMetaTitle,
    description: siteConfig.description,
    path: '/fr',
    locale: 'fr',
    hreflang: [
      { hreflang: 'en', href: absoluteUrl('/') },
      { hreflang: 'fr', href: absoluteUrl('/fr') },
      { hreflang: 'x-default', href: absoluteUrl('/') }
    ]
  });
}

export default async function FrenchHomePage() {
  const locale = 'fr';
  const [featuredPosts, categories, recentPosts, authors] = await Promise.all([
    contentRepository.getFeaturedPostsByLocale(locale, 3),
    contentRepository.getAllCategoriesByLocale(locale),
    contentRepository.getRecentPostsByLocale(locale, 4),
    contentRepository.getAllAuthorsByLocale(locale)
  ]);
  const displayablePosts = recentPosts.length > 0 ? recentPosts : featuredPosts;
  const primaryPosts = displayablePosts.length >= 3 ? displayablePosts.slice(0, 3) : displayablePosts;
  const normalizedCategories = categories.map(withConfiguredShortCategoryCopy);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">{siteConfig.name}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{siteConfig.defaultMetaTitle}</h1>
          <p className="mt-5 max-w-2xl text-base text-slate-600">{siteConfig.description}</p>
        </Container>
      </section>

      {primaryPosts.length > 0 ? (
        <section className="py-14">
          <Container>
            <SectionHeading>{displayablePosts.length >= 3 ? 'Articles à la une' : 'Derniers articles'}</SectionHeading>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {primaryPosts.map((post) => (
                <PostCard key={post.id} post={post} author={authors.find((author) => author.slug === post.authorSlug)} category={normalizedCategories.find((category) => category.slug === post.categorySlug)} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section id="categories" className="py-14">
        <Container>
          <SectionHeading>Catégories</SectionHeading>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {normalizedCategories.map((category) => (
              <CategoryCard key={category.id} category={category} locale={locale} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <NewsletterCta locale="fr" />
        </Container>
      </section>
    </>
  );
}
