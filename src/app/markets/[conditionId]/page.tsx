import { notFound } from 'next/navigation';
import { MarketDetail } from '@/components/market-detail';
import { getMarket, getOrderbook } from '@/lib/polymarket';

export const revalidate = 15;

export default async function MarketPage({
  params,
}: {
  params: Promise<{ conditionId: string }>;
}) {
  const { conditionId } = await params;
  const [market, orderbook] = await Promise.all([getMarket(conditionId), getOrderbook(conditionId)]);

  if (!market) notFound();

  return <MarketDetail market={market} orderbook={orderbook} />;
}
