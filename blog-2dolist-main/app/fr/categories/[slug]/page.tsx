import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/ui/Container';
import { withConfiguredLongCategoryCopy } from '@/lib/content/category-copy';
import { contentRepository } from '@/lib/content/repository';
import { absoluteUrl, getCategoryPath } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site/config';

export async function generateStaticParams() {
  const categories = await contentRepository.getAllCategoriesByLocale('fr');
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const rawCategory = await contentRepository.getCategoryBySlugAndLocale(slug, 'fr');
  const category = rawCategory ? withConfiguredLongCategoryCopy(rawCategory) : undefined;
  const path = getCategoryPath('fr', slug);

  if (!category) {
    return buildMetadata({
      title: `Catégorie introuvable | ${siteConfig.name}`,
      description: 'Catégorie indisponible.',
      path,
      locale: 'fr',
      noIndex: true
    });
  }

  return buildMetadata({
    title: `${category.title} | Catégorie`,
    description: category.description,
    path: getCategoryPath('fr', category.slug),
    locale: 'fr',
    hreflang: [
      { hreflang: 'en', href: absoluteUrl(getCategoryPath('en', category.slug)) },
      { hreflang: 'fr', href: absoluteUrl(getCategoryPath('fr', category.slug)) },
      { hreflang: 'x-default', href: absoluteUrl(getCategoryPath('en', category.slug)) }
    ]
  });
}

export default async function FrenchCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rawCategory = await contentRepository.getCategoryBySlugAndLocale(slug, 'fr');
  const category = rawCategory ? withConfiguredLongCategoryCopy(rawCategory) : undefined;

  if (!category) notFound();

  const [posts, authors] = await Promise.all([
    contentRepository.getPostsByCategoryAndLocale(slug, 'fr'),
    contentRepository.getAllAuthorsByLocale('fr')
  ]);

  return (
    <Container>
      <section className="py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{category.title}</h1>
        <p className="mt-2 max-w-2xl text-slate-600">{category.description}</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} author={authors.find((author) => author.slug === post.authorSlug)} category={category} />
          ))}
        </div>
      </section>
    </Container>
  );
}
