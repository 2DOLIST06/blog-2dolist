import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Fil d'ariane" className="mb-6 text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, idx) => (
          <li key={item.href} className="flex items-center gap-2">
            {idx > 0 ? <span>/</span> : null}
            <Link className="hover:text-slate-900" href={item.href}>
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
