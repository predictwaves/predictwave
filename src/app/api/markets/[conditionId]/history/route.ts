import { NextResponse } from 'next/server';
import { getMarket, getPriceHistory } from '@/lib/polymarket';

export const revalidate = 60;

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
