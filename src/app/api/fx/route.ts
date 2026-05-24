import { NextResponse } from 'next/server';
import { getCachedRate } from '@/lib/fx';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pair = url.searchParams.get('pair') ?? 'NGN/USD';
  try {
    const rate = await getCachedRate(pair);
    return NextResponse.json(rate, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: { code: 'FX_FETCH_FAILED', message } }, { status: 502 });
  }
}
