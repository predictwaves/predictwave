'use client';
import {
  getEmbeddedConnectedWallet,
  useDelegatedActions,
  useIdentityToken,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type SetupPhase = 'idle' | 'authorizing' | 'setting-up';

// Client-side view of the server-managed trading session. Signing happens server-side
// via Privy delegated actions, so the user first grants the app permission to act on
// their wallet (one-time consent modal), then the server runs setup + places orders.
export function useTradingSession() {
  const { authenticated, getAccessToken, user } = usePrivy();
  const { identityToken } = useIdentityToken();
  const { wallets } = useWallets();
  const { delegateWallet } = useDelegatedActions();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<SetupPhase>('idle');

  // Embedded wallet delegated to the app? Its linked-account carries the flag.
  const isDelegated = !!user?.linkedAccounts?.find(
    (a) => a.type === 'wallet' && (a as { delegated?: boolean }).delegated,
  );

  const statusQuery = useQuery({
    queryKey: ['trading-status'],
    enabled: authenticated,
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) return { ready: false };
      const res = await fetch('/api/trading/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ privyAccessToken: token }),
      });
      if (!res.ok) return { ready: false };
      return (await res.json()) as { ready: boolean };
    },
  });

  const setup = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      if (!identityToken) {
        throw new Error('Identity token not yet available — please refresh and try again');
      }

      // 1) One-time consent: delegate the embedded wallet to the app so the server can
      // sign on the user's behalf. Skipped if already delegated (returning user).
      if (!isDelegated) {
        const embedded = getEmbeddedConnectedWallet(wallets);
        if (!embedded) throw new Error('Wallet not ready');
        setPhase('authorizing');
        await delegateWallet({ address: embedded.address, chainType: 'ethereum' });
      }

      // 2) Server-side gasless setup (deploy + approvals) using delegated signing.
      setPhase('setting-up');
      const res = await fetch('/api/trading/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ privyAccessToken: token, privyIdentityToken: identityToken }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(e?.error?.message ?? 'Setup failed');
      }
      return (await res.json()) as { ready: boolean; walletAddress: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-status'] });
    },
    onSettled: () => setPhase('idle'),
  });

  return {
    isReady: statusQuery.data?.ready ?? false,
    isCheckingStatus: statusQuery.isLoading,
    identityTokenReady: !!identityToken,
    runSetup: setup.mutate,
    isSettingUp: setup.isPending,
    setupPhase: phase,
    setupError: setup.error instanceof Error ? setup.error.message : null,
  };
}
