'use client';
import { getEmbeddedConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeriveClobCreds } from '@/hooks/use-derive-clob-creds';

export type OrderPhase = 'authorizing' | 'signing' | 'submitting';

interface PlaceOrderArgs {
  conditionId: string;
  tokenId: string;
  side: 'BUY' | 'SELL';
  priceUsdc: number;
  sizeUsdc: number;
  onPhase?: (phase: OrderPhase) => void;
}

interface ApiError {
  error?: { message?: string };
}

export function usePlaceOrder() {
  const { wallets } = useWallets();
  const { getAccessToken } = usePrivy();
  const derive = useDeriveClobCreds();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: PlaceOrderArgs) => {
      const embedded = getEmbeddedConnectedWallet(wallets);
      if (!embedded) throw new Error('Wallet not ready');
      const address = embedded.address as `0x${string}`;
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Not authenticated');

      // 0) One-time: ensure the user has their own CLOB creds. First trade signs an
      // L1 auth message so the server can derive + store them.
      const hasRes = await fetch('/api/orders/has-creds', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ privyAccessToken: accessToken }),
      });
      const { hasCreds } = (await hasRes.json().catch(() => ({ hasCreds: false }))) as {
        hasCreds: boolean;
      };
      if (!hasCreds) {
        args.onPhase?.('authorizing');
        await derive.mutateAsync();
      }

      // 1) Prepare — server builds the EIP-712 typed data + hash.
      const prepareRes = await fetch('/api/orders/prepare', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...args, makerAddress: address }),
      });
      if (!prepareRes.ok) {
        const e = (await prepareRes.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error?.message ?? 'Prepare failed');
      }
      const { typedData, orderHash, expectedShares } = await prepareRes.json();

      // 2) Sign with the Privy embedded wallet via its EIP-1193 provider.
      args.onPhase?.('signing');
      const provider = await embedded.getEthereumProvider();
      const signature = (await provider.request({
        method: 'eth_signTypedData_v4',
        params: [address, JSON.stringify(typedData)],
      })) as `0x${string}`;

      // 3) Submit — server posts the signed order using the user's own CLOB creds.
      args.onPhase?.('submitting');
      const submitRes = await fetch('/api/orders/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          typedData,
          signature,
          orderHash,
          conditionId: args.conditionId,
          privyAccessToken: accessToken,
        }),
      });
      if (!submitRes.ok) {
        const e = (await submitRes.json().catch(() => null)) as ApiError | null;
        throw new Error(e?.error?.message ?? 'Submit failed');
      }
      const result = await submitRes.json();
      return { ...result, expectedShares: expectedShares as number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
}
