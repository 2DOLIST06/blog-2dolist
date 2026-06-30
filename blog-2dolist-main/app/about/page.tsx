import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site/config';

export const metadata: Metadata = buildMetadata({
  title: `About | ${siteConfig.name}`,
  description: siteConfig.description,
  path: '/about'
});

export default function AboutPage() {
  return (
    <Container>
      <section className="py-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-slate-950">About {siteConfig.name}</h1>
          <p className="mt-6 text-slate-700">This page can be customized with the editorial presentation of the current blog.</p>
        </div>
      </section>
    </Container>
  );
}
