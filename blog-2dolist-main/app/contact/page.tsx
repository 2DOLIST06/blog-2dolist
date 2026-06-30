import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site/config';

export const metadata: Metadata = buildMetadata({
  title: `Contact | ${siteConfig.name}`,
  description: 'Contactez notre équipe éditoriale.',
  path: '/contact'
});

export default function ContactPage() {
  return (
    <Container>
      <section className="py-12">
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="mt-3 text-slate-700">Une question, une proposition de collaboration ou un retour lecteur ?</p>
        <form className="mt-6 max-w-xl space-y-4">
          <input placeholder="Nom" className="w-full rounded-lg border border-slate-300 px-4 py-3" />
          <input type="email" placeholder="Email" className="w-full rounded-lg border border-slate-300 px-4 py-3" />
          <textarea placeholder="Message" rows={6} className="w-full rounded-lg border border-slate-300 px-4 py-3" />
          <button className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Envoyer</button>
        </form>
      </section>
    </Container>
  );
}
