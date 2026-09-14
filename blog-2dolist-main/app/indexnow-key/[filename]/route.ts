import { getIndexNowKey } from '@/lib/indexnow/server';
import { getVerificationContent } from '@/lib/indexnow/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const content = getVerificationContent(getIndexNowKey(), filename);
  if (!content) return new Response('Not Found', { status: 404 });
  return new Response(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
