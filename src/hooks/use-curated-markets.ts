import { useQuery } from '@tanstack/react-query';

export interface CuratedMarket {
  id: string;
  condition_id: string;
  market_slug: string;
  curator_note: string | null;
  category: 'politics' | 'sports' | 'crypto' | 'nigeria' | 'world' | 'other' | null;
  featured_rank: number | null;
  hidden: boolean;
  created_at: string;
}

export function useCuratedMarkets(category?: CuratedMarket['category']) {
  return useQuery<{ markets: CuratedMarket[] }>({
    queryKey: ['curated-markets', category ?? 'all'],
    queryFn: async () => {
      const url = category ? `/api/markets/curated?category=${category}` : '/api/markets/curated';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Curated markets fetch failed');
      return res.json() as Promise<{ markets: CuratedMarket[] }>;
    },
    staleTime: 5 * 60_000,
  });
}
