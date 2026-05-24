import { useQuery } from '@tanstack/react-query';

interface FxResponse {
  pair: string;
  rate: number;
  fetchedAt: string;
  source: string;
  stale: boolean;
}

export function useFxRate(pair = 'NGN/USD') {
  return useQuery<FxResponse>({
    queryKey: ['fx', pair],
    queryFn: async () => {
      const res = await fetch(`/api/fx?pair=${encodeURIComponent(pair)}`);
      if (!res.ok) throw new Error('FX fetch failed');
      return res.json() as Promise<FxResponse>;
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
