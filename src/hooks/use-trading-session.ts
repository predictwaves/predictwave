'use client';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { loadSetup, saveSetup, setupTrading } from '@/lib/polymarket-trading-client';

type SetupPhase = 'idle' | 'setting-up';

// Client-side trading session. Setup runs entirely in the browser: the Privy embedded
// wallet signs the gasless deposit-wallet deploy + approvals, and the resulting CLOB
// credentials are cached in localStorage so returning users skip setup.
export function useTradingSession() {
  const { authenticated, user, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<SetupPhase>('idle');

  const address = user?.wallet?.address;

  const statusQuery = useQuery({
    queryKey: ['trading-status', address],
    enabled: authenticated && !!address,
    queryFn: () => ({ ready: !!loadSetup(address as string) }),
  });

  const setup = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Not authenticated');
      const wallet = wallets.find((w) => w.address === address);
      if (!wallet) throw new Error('Wallet not ready');
      setPhase('setting-up');
      const result = await setupTrading(wallet, getAccessToken);
      saveSetup(address, result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-status', address] });
    },
    onSettled: () => setPhase('idle'),
  });

  return {
    isReady: statusQuery.data?.ready ?? false,
    isCheckingStatus: statusQuery.isLoading,
    runSetup: setup.mutate,
    isSettingUp: setup.isPending,
    setupPhase: phase,
    setupError: setup.error instanceof Error ? setup.error.message : null,
  };
}
