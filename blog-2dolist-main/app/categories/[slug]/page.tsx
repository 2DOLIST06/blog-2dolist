import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/ui/Container';
import { withStrengthTrainingLongCopy } from '@/lib/content/category-copy';
import { contentRepository } from '@/lib/content/repository';
import { absoluteUrl, getCategoryPath } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateStaticParams() {
  const categories = await contentRepository.getAllCategoriesByLocale('en');
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const rawCategory = await contentRepository.getCategoryBySlugAndLocale(slug, 'en');
  const category = rawCategory ? withStrengthTrainingLongCopy(rawCategory, 'en') : undefined;
  const path = getCategoryPath('en', slug);

  if (!category) {
    return buildMetadata({
      title: 'Category not found | Body Training Guide',
      description: 'Category unavailable.',
      path,
      locale: 'en',
      noIndex: true
    });
  }

  return buildMetadata({
    title: `${category.title} | Category`,
    description: category.description,
    path: getCategoryPath('en', category.slug),
    locale: 'en',
    hreflang: [
      { hreflang: 'en', href: absoluteUrl(getCategoryPath('en', category.slug)) },
      { hreflang: 'fr', href: absoluteUrl(getCategoryPath('fr', category.slug)) },
      { hreflang: 'x-default', href: absoluteUrl(getCategoryPath('en', category.slug)) }
    ]
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rawCategory = await contentRepository.getCategoryBySlugAndLocale(slug, 'en');
  const category = rawCategory ? withStrengthTrainingLongCopy(rawCategory, 'en') : undefined;

  if (!category) notFound();

  const [posts, authors] = await Promise.all([
    contentRepository.getPostsByCategoryAndLocale(slug, 'en'),
    contentRepository.getAllAuthorsByLocale('en')
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
