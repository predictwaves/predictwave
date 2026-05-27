'use client';
import { useDepositWallet } from '@/hooks/use-deposit-wallet';
import { useFxRate } from '@/hooks/use-fx-rate';
import { useWalletBalance } from '@/hooks/use-wallet-balance';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';
import { Skeleton } from '@/components/ui/skeleton';

export function WalletBalance() {
  // pUSD held by the deposit wallet is the real buying power, not the EOA's USDC.e.
  const address = useDepositWallet();

  const { data: balance, isLoading: balanceLoading } = useWalletBalance(address);
  const { data: fx, isLoading: fxLoading } = useFxRate();

  if (fxLoading || (address && balanceLoading)) {
    return (
      <div className="flex flex-col gap-1">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  // No deposit wallet yet (setup not run in this browser) → zero buying power.
  const usdc = address ? (balance ?? 0) : 0;
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
