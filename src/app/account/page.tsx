'use client';
import { getEmbeddedConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConnectButton } from '@/components/connect-button';
import { WalletBalance } from '@/components/wallet-balance';

function truncateMiddle(s: string, start = 8, end = 6): string {
  if (s.length <= start + end) return s;
  return `${s.slice(0, start)}…${s.slice(-end)}`;
}

export default function AccountPage() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  if (!ready) {
    return null;
  }

  if (!authenticated) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-base font-medium" style={{ color: 'var(--gray-700)' }}>
          Sign in to see your account
        </p>
        <ConnectButton />
      </main>
    );
  }

  const embeddedWallet = getEmbeddedConnectedWallet(wallets);
  const address = embeddedWallet?.address ?? '';
  const email = user?.email?.address ?? user?.google?.email ?? '';

  async function handleCopy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    toast.success('Address copied');
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 flex flex-col gap-6">
      {email && (
        <p className="text-sm" style={{ color: 'var(--gray-600)' }}>
          {email}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your wallet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <code
              className="flex-1 font-mono text-xs break-all"
              style={{ color: 'var(--gray-700)' }}
            >
              {truncateMiddle(address)}
            </code>
            <button
              type="button"
              className="text-xs font-medium px-2 py-1 rounded"
              style={{ background: 'var(--green-50)', color: 'var(--green-700)' }}
              onClick={() => void handleCopy()}
            >
              Copy
            </button>
          </div>
          <WalletBalance />
        </CardContent>
      </Card>

      <p className="text-xs text-center" style={{ color: 'var(--gray-400)' }}>
        Powered by Polygon. Stablecoin: USDC (bridged).
      </p>
    </main>
  );
}
