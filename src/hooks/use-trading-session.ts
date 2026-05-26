'use client';
import { useIdentityToken, usePrivy } from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Client-side view of the server-managed trading session. All signing happens server
// side via Privy delegated signing — the browser just triggers setup and reads status.
export function useTradingSession() {
  const { authenticated, getAccessToken } = usePrivy();
  const { identityToken } = useIdentityToken();
  const queryClient = useQueryClient();

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
      const res = await fetch('/api/trading/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ privyAccessToken: token, privyIdentityToken: identityToken ?? '' }),
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
  });

  return {
    isReady: statusQuery.data?.ready ?? false,
    isCheckingStatus: statusQuery.isLoading,
    runSetup: setup.mutate,
    isSettingUp: setup.isPending,
    setupError: setup.error instanceof Error ? setup.error.message : null,
  };
}
