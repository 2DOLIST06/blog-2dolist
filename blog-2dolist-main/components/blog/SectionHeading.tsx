import type { PropsWithChildren } from 'react';

export function SectionHeading({ children }: PropsWithChildren) {
  return <h2 className="text-2xl font-bold tracking-tight text-slate-900">{children}</h2>;
}
