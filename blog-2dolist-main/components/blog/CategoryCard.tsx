import Link from 'next/link';
import { getCategoryPath, type Locale } from '@/lib/i18n/routing';
import type { Category } from '@/types/content';

export function CategoryCard({ category, locale = 'fr' }: { category: Category; locale?: Locale }) {
  return (
    <Link
      href={getCategoryPath(locale, category.slug)}
      className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300"
    >
      <h3 className="font-semibold text-slate-900">{category.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{category.description}</p>
    </Link>
  );
}
