import { NextResponse } from 'next/server';
import { getMarket, getOrderbook } from '@/lib/polymarket';

export const revalidate = 15;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conditionId: string }> },
) {
  const { conditionId } = await params;
  const [market, orderbook] = await Promise.all([getMarket(conditionId), getOrderbook(conditionId)]);
  if (!market) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Market not found' } },
      { status: 404 },
    );
  }
  return NextResponse.json({ market, orderbook });
}
