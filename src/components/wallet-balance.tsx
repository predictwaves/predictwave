'use client';
import { getEmbeddedConnectedWallet, useWallets } from '@privy-io/react-auth';
import { useFxRate } from '@/hooks/use-fx-rate';
import { useWalletBalance } from '@/hooks/use-wallet-balance';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';
import { Skeleton } from '@/components/ui/skeleton';

export function WalletBalance() {
  const { wallets } = useWallets();
  const embeddedWallet = getEmbeddedConnectedWallet(wallets);
  const address = embeddedWallet?.address as `0x${string}` | undefined;

  const { data: balance, isLoading: balanceLoading } = useWalletBalance(address);
  const { data: fx, isLoading: fxLoading } = useFxRate();

  if (balanceLoading || fxLoading || !address) {
    return (
      <div className="flex flex-col gap-1">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  const usdc = balance ?? 0;
  const rate = fx?.rate ?? 1700;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-lg font-semibold" style={{ color: 'var(--gray-900)' }}>
        {formatUsdc(usdc)}
      </span>
      <span className="text-sm" style={{ color: 'var(--gray-500)' }}>
        {formatNgn(usdcToNgn(usdc, rate))}
      </span>
    </div>
  );
}
