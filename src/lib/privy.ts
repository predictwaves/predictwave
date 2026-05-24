import type { PrivyClientConfig } from '@privy-io/react-auth';
import { polygon } from 'viem/chains';

// Privy's Chain type (from @privy-io/js-sdk-core) requires `testnet: boolean`,
// while viem's Chain has `testnet?: boolean`. polygon.testnet is false at runtime.
const polygonChain = { ...polygon, testnet: false };

export const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: 'light',
    accentColor: '#15803D',
    logo: '/logo.svg',
    showWalletLoginFirst: false,
  },
  loginMethods: ['email', 'google', 'twitter'],
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
    showWalletUIs: false,
  },
  defaultChain: polygonChain,
  supportedChains: [polygonChain],
};
