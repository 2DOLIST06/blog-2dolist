import Link from 'next/link';
import { Container } from '@/components/ui/Container';

export default function NotFound() {
  return (
    <Container>
      <section className="py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">404</p>
        <h1 className="mt-2 text-3xl font-bold">Page introuvable</h1>
        <p className="mt-3 text-slate-600">La page demandée n’existe pas ou a été déplacée.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
          Revenir à l’accueil
        </Link>
      </section>
    </Container>
  );
}
