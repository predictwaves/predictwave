import { useQuery } from '@tanstack/react-query';
import type { MarketMeta } from '@/lib/polymarket';
import type { OrderBookSummary } from '@polymarket/clob-client';

interface MarketResponse {
  market: MarketMeta;
  orderbook: OrderBookSummary | null;
}

export function useMarket(conditionId: string) {
  return useQuery<MarketResponse>({
    queryKey: ['market', conditionId],
    queryFn: async () => {
      const res = await fetch(`/api/markets/${conditionId}`);
      if (!res.ok) throw new Error('Market fetch failed');
      return res.json() as Promise<MarketResponse>;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
