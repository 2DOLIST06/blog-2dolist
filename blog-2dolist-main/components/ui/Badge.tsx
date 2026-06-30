import type { PropsWithChildren } from 'react';

export function Badge({ children }: PropsWithChildren) {
  return (
    <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
      {children}
    </span>
  );
}
