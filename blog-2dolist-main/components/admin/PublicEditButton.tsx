import Link from 'next/link';

interface PublicEditButtonProps {
  href: string;
  label: string;
}

export function PublicEditButton({ href, label }: PublicEditButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
      aria-label={label}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M13.59 2.59a2 2 0 0 1 2.82 2.82l-9.5 9.5a1 1 0 0 1-.46.26l-3.25.81a1 1 0 0 1-1.21-1.21l.81-3.25a1 1 0 0 1 .26-.46l9.5-9.5ZM12.5 4.5l3 3" />
      </svg>
      {label}
    </Link>
  );
}
