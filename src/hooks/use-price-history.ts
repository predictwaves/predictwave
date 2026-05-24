import { useQuery } from '@tanstack/react-query';

export interface PricePoint {
  t: number;
  p: number;
}

export type HistoryInterval = '1h' | '1d' | '1w' | 'all';

export function usePriceHistory(conditionId: string, interval: HistoryInterval = '1d') {
  return useQuery<{ history: PricePoint[] }>({
    queryKey: ['price-history', conditionId, interval],
    queryFn: async () => {
      const res = await fetch(`/api/markets/${conditionId}/history?interval=${interval}`);
      if (!res.ok) throw new Error('Price history fetch failed');
      return res.json() as Promise<{ history: PricePoint[] }>;
    },
    staleTime: 60_000,
  });
}
