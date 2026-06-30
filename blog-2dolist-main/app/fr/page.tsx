import type { Metadata } from 'next';
import { CategoryCard } from '@/components/blog/CategoryCard';
import { NewsletterCta } from '@/components/blog/NewsletterCta';
import { PostCard } from '@/components/blog/PostCard';
import { SectionHeading } from '@/components/blog/SectionHeading';
import { Container } from '@/components/ui/Container';
import { withStrengthTrainingShortCopy } from '@/lib/content/category-copy';
import { contentRepository } from '@/lib/content/repository';
import { buildMetadata } from '@/lib/seo/metadata';

const homeDescription = 'Guides de musculation, exercices, nutrition et récupération pour mieux organiser vos entraînements et progresser avec une méthode claire.';
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Body Training Guide',
  url: 'https://bodytrainingguide.com/fr',
  inLanguage: 'fr',
  description: 'Guides de musculation, exercices, nutrition et récupération pour mieux organiser vos entraînements.'
};

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Body Training Guide | Guides de musculation et nutrition',
    description: homeDescription,
    path: '/fr',
    canonicalUrl: 'https://bodytrainingguide.com/fr',
    locale: 'fr',
    hreflang: [
      { hreflang: 'en', href: 'https://bodytrainingguide.com' },
      { hreflang: 'fr', href: 'https://bodytrainingguide.com/fr' },
      { hreflang: 'x-default', href: 'https://bodytrainingguide.com' }
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
  const normalizedCategories = categories.map((category) => withStrengthTrainingShortCopy(category, locale));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Body Training Guide</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Construisez un physique fort avec une méthode claire.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-600">{homeDescription}</p>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Guides de musculation pour progresser avec une méthode simple</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Body Training Guide regroupe des articles sur la musculation, les exercices, les groupes musculaires, la nutrition et la récupération. L’objectif est d’aider à comprendre quoi travailler, comment organiser ses séances et comment progresser sans ajouter de complexité inutile.
            </p>
          </div>
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
