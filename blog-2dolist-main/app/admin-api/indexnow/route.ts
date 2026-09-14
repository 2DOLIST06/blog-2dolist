import { NextResponse } from 'next/server';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';
import { filterAllowedUrls } from '@/lib/indexnow/core';
import { getIndexNowPages, IndexNowSubmissionError, submitIndexNowPages } from '@/lib/indexnow/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });

export async function GET() {
  if ((await buildUpstreamAuthHeaders()) === null) return unauthorized();
  try {
    return NextResponse.json({ data: await getIndexNowPages() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Liste IndexNow indisponible.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if ((await buildUpstreamAuthHeaders()) === null) return unauthorized();
  const body = (await request.json().catch(() => null)) as { urls?: unknown; onlyNeeded?: unknown } | null;
  if (!body || (body.onlyNeeded !== true && !Array.isArray(body.urls))) {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  try {
    const pages = await getIndexNowPages();
    const requestedUrls = body.onlyNeeded === true
      ? pages.filter((page) => page.needsSubmission).map((page) => page.url)
      : filterAllowedUrls(body.urls as unknown[], new Set(pages.map((page) => page.url)));
    const selected = new Set(requestedUrls);
    const submittedUrls = await submitIndexNowPages(pages.filter((page) => selected.has(page.url)));
    return NextResponse.json({ data: { submittedUrls } });
  } catch (error) {
    if (error instanceof IndexNowSubmissionError) {
      return NextResponse.json({ error: error.message, submittedUrls: error.submittedUrls }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Envoi IndexNow impossible.' }, { status: 500 });
  }
}
