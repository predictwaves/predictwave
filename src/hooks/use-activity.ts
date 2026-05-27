'use client';
import { useQuery } from '@tanstack/react-query';

export interface Activity {
  type: string;
  side: string | null;
  question: string;
  outcomeName: string;
  shares: number;
  priceUsdc: number;
  valueUsdc: number;
  timestamp: number;
  conditionId: string;
  txHash: string | null;
}

export function useActivity(address: `0x${string}` | undefined) {
  return useQuery<{ activity: Activity[] }>({
    queryKey: ['activity', address],
    queryFn: async () => {
      if (!address) return { activity: [] };
      const res = await fetch(`/api/wallet/activity?address=${address}`);
      if (!res.ok) return { activity: [] };
      return res.json();
    },
    enabled: !!address,
    refetchInterval: 30_000,
  });
}
