'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Articles', href: '/admin/posts' },
  { label: 'Créer un article', href: '/admin/posts/new' }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen grid-cols-1 gap-0 md:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-800 bg-slate-900 p-6">
          <p className="text-lg font-bold">Admin · The Muscle Temple</p>
          <nav className="mt-6 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm ${pathname === link.href ? 'bg-brand-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
