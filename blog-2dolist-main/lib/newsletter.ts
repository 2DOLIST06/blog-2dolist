export interface NewsletterSubscriptionResponse {
  message: string;
  data?: {
    id: string;
    email: string;
    alreadySubscribed: boolean;
  };
}

const getErrorMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return undefined;

  const candidate = payload as { message?: unknown; error?: unknown };

  if (typeof candidate.message === 'string' && candidate.message.trim()) return candidate.message;
  if (typeof candidate.error === 'string' && candidate.error.trim()) return candidate.error;

  return undefined;
};

export async function subscribeToNewsletter(email: string, source = 'newsletter-section'): Promise<NewsletterSubscriptionResponse> {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    throw new Error('Veuillez saisir une adresse e-mail.');
  }

  const response = await fetch('/api/newsletter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: normalizedEmail, source })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload) ?? 'Erreur pendant l’inscription newsletter.');
  }

  return payload as NewsletterSubscriptionResponse;
}
