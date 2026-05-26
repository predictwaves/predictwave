'use client';
import { useIdentityToken, usePrivy } from '@privy-io/react-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PlaceOrderArgs {
  conditionId: string;
  tokenId: string;
  side: 'BUY' | 'SELL';
  price: number; // 0..1 USDC per share
  size: number; // shares
}

// Places an order server-side: the server signs via Privy delegated signing and posts
// through the unified SDK with the builder code attached.
export function usePlaceOrder() {
  const { getAccessToken } = usePrivy();
  const { identityToken } = useIdentityToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: PlaceOrderArgs) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/trading/place-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...args,
          privyAccessToken: token,
          privyIdentityToken: identityToken ?? '',
        }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(e?.error?.message ?? 'Order failed');
      }
      return (await res.json()) as { ok: boolean; orderId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
}
