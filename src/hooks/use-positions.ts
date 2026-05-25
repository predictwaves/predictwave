'use client';
import { useQuery } from '@tanstack/react-query';

export interface Position {
  conditionId: string;
  question: string;
  outcomeName: string;
  shares: number;
  averagePriceUsdc: number;
  currentPriceUsdc: number;
  valueUsdc: number;
  pnlUsdc: number;
}

export function usePositions(address: `0x${string}` | undefined) {
  return useQuery<{ positions: Position[] }>({
    queryKey: ['positions', address],
    queryFn: async () => {
      if (!address) return { positions: [] };
      const res = await fetch(`/api/wallet/positions?address=${address}`);
      if (!res.ok) return { positions: [] };
      return res.json();
    },
    enabled: !!address,
    refetchInterval: 20_000,
  });
}
