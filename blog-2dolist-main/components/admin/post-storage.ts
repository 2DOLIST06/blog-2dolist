'use client';

import type { AdminPostDraft } from '@/types/admin';

const KEY = 'mt_admin_posts';

export const getStoredPosts = (): AdminPostDraft[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminPostDraft[]) : [];
  } catch {
    return [];
  }
};

export const clearStoredPosts = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
};
