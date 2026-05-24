import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { ERC20_BALANCE_OF_ABI, USDC_E_ADDRESS, USDC_E_DECIMALS, polygonClient } from '@/lib/viem';

export function useWalletBalance(address: `0x${string}` | undefined) {
  return useQuery({
    queryKey: ['wallet-balance', address],
    queryFn: async () => {
      if (!address) return 0;
      const raw = await polygonClient.readContract({
        address: USDC_E_ADDRESS,
        abi: ERC20_BALANCE_OF_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      return Number(formatUnits(raw, USDC_E_DECIMALS));
    },
    enabled: !!address,
    refetchInterval: 15_000,
  });
}
