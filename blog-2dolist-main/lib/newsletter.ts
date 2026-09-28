import { buildPublicApiUrl, getPublicApiBaseUrl } from '@/lib/api/env';
import type { Locale } from '@/lib/i18n/routing';

export const NEWSLETTER_INTERESTS = [
  'airplane', 'ulm', 'parachuting', 'paragliding', 'paramotor', 'helicopter', 'hot_air_balloon', 'gliding'
] as const;
export type NewsletterInterest = (typeof NEWSLETTER_INTERESTS)[number];

export const NEWSLETTER_CONTENT_TYPES = [
  'new_articles', 'practical_guides', 'destination_guides', 'activity_guides', 'news_and_updates'
] as const;
export type NewsletterContentType = (typeof NEWSLETTER_CONTENT_TYPES)[number];
export type NewsletterFrequency = 'immediate' | 'weekly' | 'monthly';
export type NewsletterSource = 'footer' | 'article' | 'page';

export interface NewsletterRegion {
  id: string;
  name: string;
  slug?: string;
}

export interface NewsletterPreferences {
  email: string;
  interests: NewsletterInterest[];
  contentTypes: NewsletterContentType[];
  regions: NewsletterRegion[];
  frequency: NewsletterFrequency;
  subscribed: boolean;
}

export interface NewsletterSubscribePayload {
  email: string;
  language: Locale;
  source: NewsletterSource;
  consent: true;
  consentTextVersion: 'v1';
  interest?: NewsletterInterest;
  region?: string;
}

export interface NewsletterPreferencesPayload {
  interests: NewsletterInterest[];
  contentTypes: NewsletterContentType[];
  regions: string[];
  frequency: NewsletterFrequency;
}

export interface NewsletterSubscriptionResponse {
  message?: string;
  preferences_url?: string;
  preferences_token?: string;
  data?: {
    id?: string;
    email?: string;
    alreadySubscribed?: boolean;
    preferences_url?: string;
    preferences_token?: string;
  };
}

export class NewsletterApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'NewsletterApiError';
  }
}

const messagesByStatus: Record<number, string> = {
  400: 'Les informations transmises sont invalides. Vérifiez les champs puis réessayez.',
  404: 'Ce lien de préférences est invalide ou a expiré.',
  500: 'Le service newsletter rencontre un problème. Réessayez dans quelques instants.'
};

const getErrorMessage = (payload: unknown, status: number) => {
  if (payload && typeof payload === 'object') {
    const candidate = payload as { message?: unknown; error?: unknown };
    if (typeof candidate.message === 'string' && candidate.message.trim()) return candidate.message;
    if (typeof candidate.error === 'string' && candidate.error.trim()) return candidate.error;
  }
  return messagesByStatus[status] ?? 'Une erreur est survenue. Réessayez dans quelques instants.';
};

const newsletterUrl = (path: string) => {
  if (!getPublicApiBaseUrl()) {
    throw new NewsletterApiError('Le service newsletter est indisponible : origine API non configurée.');
  }
  return buildPublicApiUrl(path);
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(init?.headers);
    if (init?.body) headers.set('Content-Type', 'application/json');
    response = await fetch(newsletterUrl(path), { ...init, headers });
  } catch (error) {
    if (error instanceof NewsletterApiError) throw error;
    throw new NewsletterApiError('Le service newsletter est indisponible. Vérifiez votre connexion puis réessayez.');
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new NewsletterApiError(getErrorMessage(payload, response.status), response.status);
  return payload as T;
}

const unwrapData = <T>(payload: T | { data: T }): T =>
  payload && typeof payload === 'object' && 'data' in payload ? (payload as { data: T }).data : payload as T;

export const subscribeToNewsletter = (payload: NewsletterSubscribePayload) =>
  request<NewsletterSubscriptionResponse>('/api/newsletter/subscribe', {
    method: 'POST', body: JSON.stringify(payload)
  });

export const getNewsletterPreferences = async (token: string) =>
  unwrapData(await request<NewsletterPreferences | { data: NewsletterPreferences }>(`/api/newsletter/preferences?${new URLSearchParams({ token })}`));

export const updateNewsletterPreferences = async (token: string, payload: NewsletterPreferencesPayload) =>
  unwrapData(await request<NewsletterPreferences | { data: NewsletterPreferences }>(`/api/newsletter/preferences?${new URLSearchParams({ token })}`, {
    method: 'PUT', body: JSON.stringify(payload)
  }));

export const unsubscribeFromNewsletter = (token: string) =>
  request<{ message?: string }>('/api/newsletter/unsubscribe', {
    method: 'POST', body: JSON.stringify({ token })
  });

export const getNewsletterRegions = async () => {
  const payload = await request<NewsletterRegion[] | { data: NewsletterRegion[] }>('/api/newsletter/regions');
  return unwrapData(payload);
};
