import { useQuery } from '@tanstack/react-query';
import type { OrderBookSummary } from '@polymarket/clob-client';

export function useMarketOrderbook(conditionId: string) {
  return useQuery<{ orderbook: OrderBookSummary | null }>({
    queryKey: ['orderbook', conditionId],
    queryFn: async () => {
      const res = await fetch(`/api/markets/${conditionId}`);
      if (!res.ok) throw new Error('Orderbook fetch failed');
      const data = (await res.json()) as { market: unknown; orderbook: OrderBookSummary | null };
      return { orderbook: data.orderbook };
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
