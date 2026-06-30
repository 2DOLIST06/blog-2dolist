'use client';

import { SiteShell } from '@/components/layout/SiteShell';

export function AppLayoutBoundary({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SiteShell>{children}</SiteShell>;
}
