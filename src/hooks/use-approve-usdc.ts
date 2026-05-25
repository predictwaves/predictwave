'use client';
import { getEmbeddedConnectedWallet, useWallets } from '@privy-io/react-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';
import { USDC_E_ADDRESS } from '@/lib/viem';

const POLYMARKET_CTF_EXCHANGE = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E' as const;
const APPROVE_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function useApproveUsdc() {
  const { wallets } = useWallets();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const embedded = getEmbeddedConnectedWallet(wallets);
      if (!embedded) throw new Error('Wallet not ready');
      const provider = await embedded.getEthereumProvider();
      const data = encodeFunctionData({
        abi: APPROVE_ABI,
        functionName: 'approve',
        args: [POLYMARKET_CTF_EXCHANGE, 2n ** 256n - 1n],
      });
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: embedded.address, to: USDC_E_ADDRESS, data }],
      });
      return txHash as `0x${string}`;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usdc-allowance'] });
    },
  });
}
