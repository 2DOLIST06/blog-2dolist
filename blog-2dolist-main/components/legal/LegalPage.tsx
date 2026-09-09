import type { ReactNode } from 'react';
import { Container } from '@/components/ui/Container';

type LegalPageProps = {
  title: string;
  intro: string;
  children: ReactNode;
};

export function LegalPage({ title, intro, children }: LegalPageProps) {
  return (
    <Container>
      <article className="mx-auto max-w-3xl py-12 sm:py-16">
        <header className="border-b border-slate-200 pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{intro}</p>
          <p className="mt-3 text-sm text-slate-500">Dernière mise à jour : 9 septembre 2026</p>
        </header>
        <div className="rich-content pt-3">{children}</div>
      </article>
    </Container>
  );
}
