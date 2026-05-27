import { NextResponse } from 'next/server';
import { getMarket, getPriceHistory } from '@/lib/polymarket';

export const revalidate = 60;
// Pin to Dublin: price-history reads hit Polymarket's CLOB, which geoblocks US regions
// (Vercel's default iad1). Run from a non-blocked EU region.
export const runtime = 'nodejs';
export const preferredRegion = 'dub1';
export const maxDuration = 30;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conditionId: string }> },
) {
  const { conditionId } = await params;
  const url = new URL(req.url);
  const interval = (url.searchParams.get('interval') ?? '1d') as '1h' | '1d' | '1w' | 'all';

  const market = await getMarket(conditionId);
  if (!market) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Market not found' } },
      { status: 404 },
    );
  }

  const yesTokenId = market.outcomes[0]?.tokenId;
  if (!yesTokenId) {
    return NextResponse.json({ history: [] });
  }

  const history = await getPriceHistory(yesTokenId, interval);
  return NextResponse.json({ history });
}
