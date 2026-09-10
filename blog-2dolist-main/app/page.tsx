import type { Metadata } from 'next';
import Link from 'next/link';
import { CategoryCard } from '@/components/blog/CategoryCard';
import { PostCard } from '@/components/blog/PostCard';
import { SectionHeading } from '@/components/blog/SectionHeading';
import { Container } from '@/components/ui/Container';
import { CATEGORY_EDITORIAL_COPY, withConfiguredShortCategoryCopy } from '@/lib/content/category-copy';
import { contentRepository } from '@/lib/content/repository';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site/config';
import type { Category } from '@/types/content';

const HOME_TITLE = 'Blog 2Dolist | Guides et conseils sur les activités aériennes et de loisirs';
const HOME_DESCRIPTION = 'Retrouvez les guides 2Dolist pour préparer un baptême de l’air, un saut en parachute, un vol en hélicoptère, une sortie ULM ou une activité de loisirs en France.';

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Blog 2Dolist',
  url: siteConfig.baseUrl,
  inLanguage: 'fr-FR',
  description: HOME_DESCRIPTION
};

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ title: HOME_TITLE, description: HOME_DESCRIPTION, path: '/', locale: 'fr', follow: true });
}

const toFallbackCategory = (slug: string): Category | undefined => {
  const copy = CATEGORY_EDITORIAL_COPY.find((item) => item.slug === slug);
  if (!copy) return undefined;
  return { id: `editorial-${slug}`, title: copy.h1, description: copy.excerpt, ...copy };
};

export default async function HomePage() {
  const locale = 'fr';
  const [categories, recentPosts, authors] = await Promise.all([
    contentRepository.getAllCategoriesByLocale(locale),
    contentRepository.getRecentPostsByLocale(locale, 6),
    contentRepository.getAllAuthorsByLocale(locale)
  ]);
  const normalizedCategories = categories.map(withConfiguredShortCategoryCopy);
  const getCategory = (slug: string) =>
    normalizedCategories.find((category) => category.slug === slug) ?? toFallbackCategory(slug);
  const aerialCategories = ['avion', 'helicoptere', 'ulm', 'parachutisme', 'parapente', 'montgolfiere', 'planeur']
    .map(getCategory)
    .filter((category): category is Category => Boolean(category));
  const leisureCategories = ['aquatique', 'montagne', 'pilotage'].map(getCategory).filter((category): category is Category => Boolean(category));
  const giftCategory = getCategory('idees-cadeaux');

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <section className="border-b border-slate-200 bg-gradient-to-br from-brand-50 via-white to-sky-50 py-16 sm:py-24">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Le blog 2Dolist</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Infos, guides et conseils sur les activités aériennes et de loisirs
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Le blog 2Dolist rassemble des guides, conseils et idées d’activités pour préparer un baptême de l’air, un saut en parachute, un vol en hélicoptère, une sortie en ULM, une balade en montgolfière ou une expérience de loisirs en France. Nos articles vous aident à comprendre le déroulement, les lieux de pratique, les conditions à prévoir et les points importants avant de réserver.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#activites-aeriennes" className="rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-500">Explorer les activités aériennes</Link>
            <Link href="#derniers-articles" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-brand-500">Lire les derniers guides</Link>
          </div>
        </Container>
      </section>

      <section id="activites-aeriennes" className="py-16 sm:py-20">
        <Container>
          <SectionHeading>Activités aériennes</SectionHeading>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">Prenez de la hauteur grâce à nos dossiers consacrés aux vols découverte, aux baptêmes de l’air et aux sensations aériennes. Chaque rubrique réunit des conseils concrets pour choisir l’expérience qui vous ressemble.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aerialCategories.map((category) => <CategoryCard key={category.id} category={category} locale={locale} />)}
          </div>
        </Container>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
        <Container>
          <SectionHeading>Guides pratiques pour bien choisir</SectionHeading>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm"><h3 className="font-semibold text-slate-900">Avant l’activité</h3><p className="mt-3 text-sm leading-6 text-slate-600">Durée, tenue, accessibilité et formalités : vérifiez les informations essentielles pour arriver serein le jour J.</p></div>
            <div className="rounded-2xl bg-white p-6 shadow-sm"><h3 className="font-semibold text-slate-900">Météo et saison</h3><p className="mt-3 text-sm leading-6 text-slate-600">Comprenez pourquoi certaines expériences dépendent des conditions et comment anticiper un éventuel report.</p></div>
            <div className="rounded-2xl bg-white p-6 shadow-sm"><h3 className="font-semibold text-slate-900">Lieux et formules</h3><p className="mt-3 text-sm leading-6 text-slate-600">Comparez les sites de pratique, les formats et les niveaux de sensations pour faire un choix adapté.</p></div>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {leisureCategories.map((category) => <CategoryCard key={category.id} category={category} locale={locale} />)}
          </div>
        </Container>
      </section>

      {recentPosts.length > 0 ? (
        <section id="derniers-articles" className="py-16 sm:py-20">
          <Container>
            <SectionHeading>Derniers articles</SectionHeading>
            <p className="mt-3 max-w-2xl text-slate-600">Nos publications les plus récentes pour préparer votre prochaine sortie et découvrir de nouvelles expériences.</p>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => <PostCard key={post.id} post={post} author={authors.find((author) => author.slug === post.authorSlug)} category={normalizedCategories.find((category) => category.slug === post.categorySlug)} />)}
            </div>
          </Container>
        </section>
      ) : null}

      {giftCategory ? (
        <section className="pb-16 sm:pb-20">
          <Container>
            <div className="rounded-3xl bg-brand-700 p-8 text-white sm:p-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-100">Faire plaisir autrement</p>
              <h2 className="mt-3 text-3xl font-bold">Des idées cadeaux à vivre</h2>
              <p className="mt-4 max-w-2xl leading-7 text-blue-50">Vol, stage de pilotage ou sortie de plein air : trouvez une expérience originale selon la saison, la région et les envies de la personne à qui vous souhaitez l’offrir.</p>
              <Link href={giftCategory.path ?? '/category/idees-cadeaux/'} className="mt-7 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-700">Découvrir les idées cadeaux</Link>
            </div>
          </Container>
        </section>
      ) : null}

      <section className="border-t border-slate-200 py-14">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div><h2 className="text-2xl font-bold text-slate-900">Prêt à passer de l’idée à l’expérience ?</h2><p className="mt-2 text-slate-600">Retrouvez des activités à réserver partout en France sur 2Dolist.</p></div>
            <a href="https://www.2dolist.fr/" className="shrink-0 rounded-full border border-brand-700 px-6 py-3 text-center text-sm font-semibold text-brand-700 transition hover:bg-brand-50">Découvrir 2Dolist.fr</a>
          </div>
        </Container>
      </section>
    </>
  );
}
