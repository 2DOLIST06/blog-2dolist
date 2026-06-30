import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/ui/Container';
import { contentRepository } from '@/lib/content/repository';
import { absoluteUrl, getAuthorPath } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateStaticParams() {
  const authors = await contentRepository.getAllAuthorsByLocale('fr');
  return authors.map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const author = await contentRepository.getAuthorBySlugAndLocale(slug, 'fr');

  if (!author) {
    return buildMetadata({
      title: 'Auteur introuvable | Body Training Guide',
      description: 'Auteur indisponible.',
      path: getAuthorPath('fr', slug),
      locale: 'fr',
      noIndex: true
    });
  }

  return buildMetadata({
    title: `${author.name} | Auteur`,
    description: author.bio,
    path: getAuthorPath('fr', author.slug),
    locale: 'fr',
    hreflang: [
      { hreflang: 'en', href: absoluteUrl(getAuthorPath('en', author.slug)) },
      { hreflang: 'fr', href: absoluteUrl(getAuthorPath('fr', author.slug)) },
      { hreflang: 'x-default', href: absoluteUrl(getAuthorPath('en', author.slug)) }
    ]
  });
}

export default async function FrenchAuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = await contentRepository.getAuthorBySlugAndLocale(slug, 'fr');

  if (!author) notFound();

  const [posts, categories] = await Promise.all([
    contentRepository.getPostsByAuthorAndLocale(slug, 'fr'),
    contentRepository.getAllCategoriesByLocale('fr')
  ]);

  return (
    <Container>
      <section className="py-12">
        <div className="flex items-center gap-4">
          <Image src={author.avatar} alt={author.name} width={72} height={72} className="rounded-full object-cover" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{author.name}</h1>
            <p className="text-slate-600">{author.role}</p>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-slate-700">{author.bio}</p>

        <h2 className="mt-10 text-xl font-semibold">Articles de cet auteur</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} author={author} category={categories.find((category) => category.slug === post.categorySlug)} />
          ))}
        </div>
      </section>
    </Container>
  );
}
