import type { Metadata } from 'next';
import { CategoryCard } from '@/components/blog/CategoryCard';
import { Container } from '@/components/ui/Container';
import { withConfiguredShortCategoryCopy } from '@/lib/content/category-copy';
import { contentRepository } from '@/lib/content/repository';
import { absoluteUrl } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site/config';
import { getPageSeo } from '@/lib/seo/pages';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getPageSeo('categories', 'en', {
    title: `Categories | ${siteConfig.name}`,
    description: 'Explore the blog categories.',
    path: '/categories',
    locale: 'en',
    hreflang: [
      { hreflang: 'en', href: absoluteUrl('/categories') },
      { hreflang: 'fr', href: absoluteUrl('/fr/categories') },
      { hreflang: 'x-default', href: absoluteUrl('/categories') }
    ]
  }));
}

export default async function CategoriesPage() {
  const categories = (await contentRepository.getAllCategoriesByLocale('en')).map((category) =>
    withConfiguredShortCategoryCopy(category)
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
