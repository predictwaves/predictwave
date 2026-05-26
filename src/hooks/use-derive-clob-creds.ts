'use client';
import { getEmbeddedConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const CHAIN_ID = 137;
const CLOB_AUTH_MESSAGE = 'This message attests that I control the given wallet';

// Mirrors the SDK's ClobAuth EIP-712 struct (and the server's clobAuthTypedData) so the
// signature verifies. Polymarket L1 auth is typed-data, NOT personal_sign.
function clobAuthTypedData(address: `0x${string}`, timestamp: number, nonce: number) {
  return {
    domain: { name: 'ClobAuthDomain', version: '1', chainId: CHAIN_ID },
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
      ],
      ClobAuth: [
        { name: 'address', type: 'address' },
        { name: 'timestamp', type: 'string' },
        { name: 'nonce', type: 'uint256' },
        { name: 'message', type: 'string' },
      ],
    },
    primaryType: 'ClobAuth',
    message: { address, timestamp: String(timestamp), nonce, message: CLOB_AUTH_MESSAGE },
  };
}

export function useDeriveClobCreds() {
  const { wallets } = useWallets();
  const { getAccessToken } = usePrivy();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const embedded = getEmbeddedConnectedWallet(wallets);
      if (!embedded) throw new Error('Wallet not ready');
      const address = embedded.address as `0x${string}`;
      const provider = await embedded.getEthereumProvider();
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Not authenticated');

      const nonce = 0;
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = (await provider.request({
        method: 'eth_signTypedData_v4',
        params: [address, JSON.stringify(clobAuthTypedData(address, timestamp, nonce))],
      })) as `0x${string}`;

      const res = await fetch('/api/orders/derive-creds', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          privyAccessToken: accessToken,
          walletAddress: address,
          nonce,
          timestamp,
          signature,
        }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(e?.error?.message ?? 'Authorization failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['has-creds'] });
    },
  });
}
