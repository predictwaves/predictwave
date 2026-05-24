import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';
import { env } from './env';

export const polygonClient = createPublicClient({
  chain: polygon,
  transport: http(env.NEXT_PUBLIC_POLYGON_RPC),
});

// Polymarket settles in USDC.e (bridged USDC) on Polygon
export const USDC_E_ADDRESS = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' as const;
export const USDC_E_DECIMALS = 6;

export const ERC20_BALANCE_OF_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
