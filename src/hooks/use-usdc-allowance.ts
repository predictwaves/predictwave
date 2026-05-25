import { useQuery } from '@tanstack/react-query';
import { polygonClient, USDC_E_ADDRESS } from '@/lib/viem';

const POLYMARKET_CTF_EXCHANGE = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E' as const;
const ERC20_ALLOWANCE_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useUsdcAllowance(address: `0x${string}` | undefined) {
  return useQuery({
    queryKey: ['usdc-allowance', address],
    queryFn: async () => {
      if (!address) return 0n;
      const result = await polygonClient.readContract({
        address: USDC_E_ADDRESS,
        abi: ERC20_ALLOWANCE_ABI,
        functionName: 'allowance',
        args: [address, POLYMARKET_CTF_EXCHANGE],
      });
      return result as bigint;
    },
    enabled: !!address,
    refetchInterval: 30_000,
  });
}
