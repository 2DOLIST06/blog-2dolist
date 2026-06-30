import { NextResponse } from 'next/server';
import { buildPublicApiUrl } from '@/lib/api/env';
import type { NewsletterSubscriptionResponse } from '@/lib/newsletter';

interface NewsletterRequestBody {
  email?: unknown;
  source?: unknown;
}

const getPayloadMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return undefined;

  const candidate = payload as { message?: unknown; error?: unknown };

  if (typeof candidate.message === 'string' && candidate.message.trim()) return candidate.message;
  if (typeof candidate.error === 'string' && candidate.error.trim()) return candidate.error;

  return undefined;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as NewsletterRequestBody;
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const source = typeof body.source === 'string' ? body.source.trim() : undefined;

  if (!email) {
    return NextResponse.json({ message: 'Veuillez saisir une adresse e-mail.' }, { status: 400 });
  }

  if (source && source.length > 120) {
    return NextResponse.json({ message: 'La source newsletter est trop longue.' }, { status: 400 });
  }

  try {
    const response = await fetch(buildPublicApiUrl('/api/newsletter'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, source }),
      cache: 'no-store'
    });

    const payload = (await response.json().catch(() => null)) as NewsletterSubscriptionResponse | { message?: string } | null;

    if (!response.ok) {
      return NextResponse.json(
        { message: getPayloadMessage(payload) ?? 'Erreur pendant l’inscription newsletter.' },
        { status: response.status }
      );
    }

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'API newsletter indisponible. Réessayez dans quelques instants.' },
      { status: 502 }
    );
  }
}
