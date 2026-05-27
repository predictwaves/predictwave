'use client';
import {
  getEmbeddedConnectedWallet,
  useIdentityToken,
  usePrivy,
  useSessionSigners,
  useWallets,
} from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { clientEnv } from '@/lib/env';

type SetupPhase = 'idle' | 'authorizing' | 'setting-up';

// Client-side view of the server-managed trading session. Signing happens server-side
// under TEE execution, so the user first grants the server's session signer access to
// their embedded wallet (one-time consent), then the server runs setup + places orders.
export function useTradingSession() {
  const { authenticated, getAccessToken, user } = usePrivy();
  const { identityToken } = useIdentityToken();
  const { wallets } = useWallets();
  const { addSessionSigners } = useSessionSigners();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<SetupPhase>('idle');

  // Session signer already provisioned on the app's embedded wallet? Privy sets the
  // `delegated` flag on the wallet's linked-account once a signer is added.
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

      // 1) One-time consent: grant the server's session signer access to the embedded
      // wallet so it can sign on the user's behalf. Skipped if already provisioned.
      if (!isDelegated) {
        const signerId = clientEnv.NEXT_PUBLIC_PRIVY_SESSION_SIGNER_ID;
        if (!signerId) throw new Error('Session signer is not configured');
        const embedded = getEmbeddedConnectedWallet(wallets);
        if (!embedded) throw new Error('Wallet not ready');
        setPhase('authorizing');
        await addSessionSigners({
          address: embedded.address,
          signers: [{ signerId }],
        });
      }

      // 2) Server-side gasless setup (deploy + approvals) via session-signer signing.
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
