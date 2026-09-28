import type { Metadata } from 'next';
import { NewsletterPreferencesCenter } from '@/components/newsletter/NewsletterPreferences';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = { title: 'Préférences newsletter | 2Dolist', robots: { index: false, follow: false } };

export default async function NewsletterPreferencesPage({ searchParams }: { searchParams: Promise<{ token?: string; action?: string }> }) {
  const { token = '', action } = await searchParams;
  return <section className="bg-slate-50 py-10 sm:py-16"><Container><div className="mx-auto max-w-4xl"><p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Newsletter 2Dolist</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Gérer mes préférences</h1><p className="mb-8 mt-3 max-w-2xl text-slate-600">Choisissez les activités, destinations et contenus que vous souhaitez recevoir.</p>{token ? <NewsletterPreferencesCenter token={token} confirmUnsubscribe={action === 'unsubscribe'} /> : <div className="rounded-2xl border border-red-200 bg-red-50 p-8" role="alert"><h2 className="font-semibold text-red-900">Lien incomplet</h2><p className="mt-2 text-red-800">Le token de préférences est absent. Utilisez le lien reçu par email.</p></div>}</div></Container></section>;
}
