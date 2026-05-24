import { useQuery } from '@tanstack/react-query';

export function useFxRate() {
  return useQuery({
    queryKey: ['fx', 'NGN/USD'],
    queryFn: async () => ({ rate: 1700, source: 'stubbed' as const }),
    staleTime: 5 * 60 * 1000,
  });
}
