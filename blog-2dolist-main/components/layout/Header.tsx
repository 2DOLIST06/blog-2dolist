'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/ui/Container';

const aerialActivities = [
  { label: 'Avion', href: '/category/aerien/avion/', icon: 'plane' },
  { label: 'Hélicoptère', href: '/category/aerien/helicoptere/', icon: 'helicopter' },
  { label: 'ULM', href: '/category/aerien/ulm/', icon: 'ulm' },
  { label: 'Parachutisme', href: '/category/aerien/parachutisme/', icon: 'parachute' },
  { label: 'Parapente', href: '/category/aerien/parapente/', icon: 'glider' },
  { label: 'Montgolfière', href: '/category/aerien/montgolfiere/', icon: 'balloon' },
  { label: 'Planeur', href: '/category/aerien/planeur/', icon: 'sailplane' }
] as const;

function ActivityIcon({ type }: { type: (typeof aerialActivities)[number]['icon'] }) {
  if (type === 'parachute') return <svg viewBox="0 0 24 24"><path d="M4 10a8 8 0 0 1 16 0M4 10c2-1 4-1 6 0 1-1 3-1 4 0 2-1 4-1 6 0M10 10l2 10m2-10-2 10m-3 0h6" /></svg>;
  if (type === 'balloon') return <svg viewBox="0 0 24 24"><path d="M18 8c0 4-3 8-6 10-3-2-6-6-6-10a6 6 0 0 1 12 0ZM9 18h6l-1 3h-4l-1-3Z" /></svg>;
  if (type === 'helicopter') return <svg viewBox="0 0 24 24"><path d="M3 12h13a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Zm13 0 3-3m-9-1V5m-6 0h12M7 16l-2 3m7-3 2 3" /></svg>;
  if (type === 'glider') return <svg viewBox="0 0 24 24"><path d="M3 8c6 0 12 2 18 5-7-2-13-2-18 0m9-3v8" /></svg>;
  if (type === 'ulm') return <svg viewBox="0 0 24 24"><path d="m3 9 9-4 9 4-9-1-9 1Zm9-1v9m-4 2h8m-6-5h4" /></svg>;
  if (type === 'sailplane') return <svg viewBox="0 0 24 24"><path d="M2 12h20M12 12l-4 6m4-6 3-6m-5 10h5" /></svg>;
  return <svg viewBox="0 0 24 24"><path d="m3 14 18-7-7 7-1 6-3-5-7-1Z" /></svg>;
}

export function Header() {
  const pathname = usePathname() ?? '/';

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_8px_30px_rgba(15,42,62,0.10)]">
      <div className="relative overflow-hidden border-b border-slate-100">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.13),transparent_65%)] lg:block" />
        <Container>
          <div className="flex h-[74px] items-center justify-between md:h-[106px]">
            <Link href="/" aria-label="Accueil du blog 2Dolist" className="group flex items-center">
              <Image src="/logo-2dolist-blog.svg" alt="2Dolist — Le blog" width={372} height={102} priority className="hidden h-[78px] w-auto transition-transform duration-300 group-hover:scale-[1.02] md:block" />
              <Image src="/logo-2dolist-mark.svg" alt="2Dolist" width={54} height={54} priority className="h-[54px] w-[54px] md:hidden" />
            </Link>
            <div className="flex items-center gap-3">
              <p className="hidden max-w-[210px] text-right text-xs font-medium leading-5 text-slate-500 lg:block">Vos guides pour prendre<br />de la hauteur</p>
              <span className="hidden h-8 w-px bg-slate-200 lg:block" />
              <a href="https://www.2dolist.fr/" className="group inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-700 sm:px-5 sm:text-sm">
                Découvrir 2Dolist
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">↗</span>
              </a>
            </div>
          </div>
        </Container>
      </div>

      <nav aria-label="Activités aériennes" className="bg-sky-600 text-white">
        <Container>
          <div className="no-scrollbar flex h-[66px] items-stretch overflow-x-auto md:h-[72px] md:justify-between">
            {aerialActivities.map((activity) => {
              const active = pathname.startsWith(activity.href.replace(/\/$/, ''));
              return (
                <Link key={activity.href} href={activity.href} aria-current={active ? 'page' : undefined} className={`group relative flex min-w-[104px] shrink-0 flex-col items-center justify-center gap-1 px-3 text-[11px] font-semibold tracking-wide transition sm:min-w-[122px] md:min-w-0 md:flex-1 md:text-xs ${active ? 'bg-white/[0.12] text-white' : 'text-sky-50/90 hover:bg-white/10 hover:text-white'}`}>
                  <span className="h-6 w-6 transition-transform duration-300 group-hover:-translate-y-0.5 [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[1.5] [&_svg]:stroke-linecap-round [&_svg]:stroke-linejoin-round"><ActivityIcon type={activity.icon} /></span>
                  <span>{activity.label}</span>
                  <span className={`absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-sky-300 transition-transform ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                </Link>
              );
            })}
          </div>
        </Container>
      </nav>
    </header>
  );
}
