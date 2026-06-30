import type { Metadata } from 'next';
import Link from 'next/link';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/ui/Container';
import { contentRepository } from '@/lib/content/repository';
import { absoluteUrl } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site/config';
import { getPageSeo } from '@/lib/seo/pages';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getPageSeo('articles', 'fr', {
    title: `Articles | ${siteConfig.name}`,
    description: 'Tous les articles français publiés.',
    path: '/fr/articles',
    locale: 'fr',
    hreflang: [
      { hreflang: 'en', href: absoluteUrl('/articles') },
      { hreflang: 'fr', href: absoluteUrl('/fr/articles') },
      { hreflang: 'x-default', href: absoluteUrl('/articles') }
    ]
  }));
}

export default async function FrenchArticlesPage() {
  const [posts, authors, categories] = await Promise.all([
    contentRepository.getAllPostsByLocale('fr'),
    contentRepository.getAllAuthorsByLocale('fr'),
    contentRepository.getAllCategoriesByLocale('fr')
  ]);

  return (
    <Container>
      <section className="py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Articles français</h1>
            <p className="mt-2 text-slate-600">Articles français chargés depuis l’API publique.</p>
          </div>
          <Link href="/articles" className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
            English
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={authors.find((author) => author.slug === post.authorSlug)}
                category={categories.find((category) => category.slug === post.categorySlug)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
            <h2 className="text-lg font-semibold text-slate-900">Aucun article français publié disponible.</h2>
            <p className="mt-2">Vérifiez que l’API renvoie des articles PUBLISHED actifs sur /api/posts?locale=fr.</p>
          </div>
        )}
      </section>
    </Container>
  );
}
