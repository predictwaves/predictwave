'use client';
import { getEmbeddedConnectedWallet, useWallets } from '@privy-io/react-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type OrderPhase = 'signing' | 'submitting';

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: PlaceOrderArgs) => {
      const embedded = getEmbeddedConnectedWallet(wallets);
      if (!embedded) throw new Error('Wallet not ready');
      const address = embedded.address as `0x${string}`;

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

      // 3) Submit — server posts the signed order to Polymarket.
      args.onPhase?.('submitting');
      const submitRes = await fetch('/api/orders/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ typedData, signature, orderHash, conditionId: args.conditionId }),
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
