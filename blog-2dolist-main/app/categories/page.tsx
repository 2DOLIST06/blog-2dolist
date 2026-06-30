import type { Metadata } from 'next';
import { CategoryCard } from '@/components/blog/CategoryCard';
import { Container } from '@/components/ui/Container';
import { withStrengthTrainingShortCopy } from '@/lib/content/category-copy';
import { contentRepository } from '@/lib/content/repository';
import { buildMetadata } from '@/lib/seo/metadata';
import { getPageSeo } from '@/lib/seo/pages';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getPageSeo('categories', 'en', {
    title: 'Categories | Body Training Guide',
    description: 'Explore the strength training blog categories.',
    path: '/categories',
    locale: 'en',
    hreflang: [
      { hreflang: 'en', href: 'https://bodytrainingguide.com/categories' },
      { hreflang: 'fr', href: 'https://bodytrainingguide.com/fr/categories' },
      { hreflang: 'x-default', href: 'https://bodytrainingguide.com/categories' }
    ]
  }));
}

export default async function CategoriesPage() {
  const categories = (await contentRepository.getAllCategoriesByLocale('en')).map((category) =>
    withStrengthTrainingShortCopy(category, 'en')
  );

  return (
    <Container>
      <section className="py-12">
        <h1 className="text-3xl font-bold">Categories</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} locale="en" />
          ))}
        </div>
      </section>
    </Container>
  );
}
