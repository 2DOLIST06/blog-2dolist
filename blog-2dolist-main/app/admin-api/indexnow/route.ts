import { NextResponse } from 'next/server';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';
import { filterAllowedUrls } from '@/lib/indexnow/core';
import { getIndexNowUrls, IndexNowSubmissionError, submitIndexNowUrls } from '@/lib/indexnow/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });

export async function GET() {
  if ((await buildUpstreamAuthHeaders()) === null) return unauthorized();
  try {
    return NextResponse.json({ data: await getIndexNowUrls() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Liste IndexNow indisponible.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if ((await buildUpstreamAuthHeaders()) === null) return unauthorized();
  const body = (await request.json().catch(() => null)) as { urls?: unknown } | null;
  if (!body || !Array.isArray(body.urls)) {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  try {
    const allowedUrls = await getIndexNowUrls();
    const selectedUrls = filterAllowedUrls(body.urls, new Set(allowedUrls));
    const result = await submitIndexNowUrls(selectedUrls);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof IndexNowSubmissionError) {
      return NextResponse.json({
        error: error.message,
        data: { submittedUrls: error.submittedUrls, batches: error.batches }
      }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Envoi IndexNow impossible.' }, { status: 500 });
  }
}
