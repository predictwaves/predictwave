import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { ERC20_BALANCE_OF_ABI, PUSD_ADDRESS, PUSD_DECIMALS, polygonClient } from '@/lib/viem';

// Reads the pUSD balance held by the deposit wallet — the actual CLOB buying power.
// Pass the deposit wallet address (not the signing EOA).
export function useWalletBalance(address: `0x${string}` | undefined) {
  return useQuery({
    queryKey: ['wallet-balance', address],
    queryFn: async () => {
      if (!address) return 0;
      const raw = await polygonClient.readContract({
        address: PUSD_ADDRESS,
        abi: ERC20_BALANCE_OF_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      return Number(formatUnits(raw, PUSD_DECIMALS));
    },
    enabled: !!address,
    refetchInterval: 15_000,
  });
}
