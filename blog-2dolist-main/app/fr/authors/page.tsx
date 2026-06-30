import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { contentRepository } from '@/lib/content/repository';
import { getAuthorPath } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';
import { getPageSeo } from '@/lib/seo/pages';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getPageSeo('authors', 'fr', {
    title: 'Auteurs | Body Training Guide',
    description: 'Découvrez les auteurs de Body Training Guide.',
    path: '/fr/authors',
    locale: 'fr',
    hreflang: [
      { hreflang: 'en', href: 'https://bodytrainingguide.com/authors' },
      { hreflang: 'fr', href: 'https://bodytrainingguide.com/fr/authors' },
      { hreflang: 'x-default', href: 'https://bodytrainingguide.com/authors' }
    ]
  }));
}

export default async function FrenchAuthorsPage() {
  const authors = await contentRepository.getAllAuthorsByLocale('fr');

  return (
    <Container>
      <section className="py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Auteurs</h1>
        <p className="mt-2 text-slate-600">Découvrez l’équipe éditoriale.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <Link key={author.id} href={getAuthorPath('fr', author.slug)} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300">
              <div className="flex items-center gap-4">
                <Image src={author.avatar} alt={author.name} width={56} height={56} className="rounded-full object-cover" />
                <div>
                  <h2 className="font-semibold text-slate-900">{author.name}</h2>
                  <p className="text-sm text-slate-600">{author.role}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">{author.bio}</p>
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
