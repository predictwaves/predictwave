'use client';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loadSetup, placeOrder } from '@/lib/polymarket-trading-client';

interface PlaceOrderArgs {
  conditionId: string;
  tokenId: string;
  side: 'BUY' | 'SELL';
  price: number; // 0..1 USDC per share
  size: number; // shares
}

// Places an order client-side: the Privy embedded wallet signs the order (POLY_1271,
// deposit wallet as maker) and posts it through the unified SDK with the builder code.
export function usePlaceOrder() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const queryClient = useQueryClient();
  const address = user?.wallet?.address;

  return useMutation({
    mutationFn: async (args: PlaceOrderArgs) => {
      if (!address) throw new Error('Not authenticated');
      const setup = loadSetup(address);
      if (!setup) throw new Error('Run trading setup first');
      const wallet = wallets.find((w) => w.address === address);
      if (!wallet) throw new Error('Wallet not ready');

      const result = await placeOrder(wallet, setup, {
        tokenId: args.tokenId,
        side: args.side,
        price: args.price,
        size: args.size,
      });
      if (!result.ok) throw new Error('Order was not accepted');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
}
