'use client';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { ConnectButton } from './connect-button';
import { useCurrencyStore } from '@/lib/currency-store';
import { useDepositWallet } from '@/hooks/use-deposit-wallet';
import { useWalletBalance } from '@/hooks/use-wallet-balance';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';

interface WalletHubProps {
  fxRate: number;
}

function BalanceCard({ fxRate }: WalletHubProps) {
  const { user } = usePrivy();
  // pUSD held by the deposit wallet is the real balance, not the EOA's holdings.
  const address = useDepositWallet();
  const { data: balance, isLoading } = useWalletBalance(address);
  const { displayCurrency, balanceVisible, toggleBalanceVisible } = useCurrencyStore();

  const usdc = balance ?? 0;
  const displayBalance = displayCurrency === 'NGN'
    ? formatNgn(usdcToNgn(usdc, fxRate))
    : formatUsdc(usdc);

  const name = user?.email?.address?.split('@')[0] ?? user?.google?.name ?? 'there';

  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-lg">
        <p className="mb-4 text-sm font-medium" style={{ color: 'var(--gray-500)' }}>
          Hi, {name} 👋
        </p>

        {/* Balance card */}
        <div className="card-iridescent rounded-2xl" style={{ padding: '48px' }}>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--gray-500)', letterSpacing: '0.1em' }}
              >
                Total balance
              </p>
              <button
                type="button"
                onClick={toggleBalanceVisible}
                className="text-[11px] font-medium"
                style={{ color: 'var(--gray-400)' }}
                aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
              >
                {balanceVisible ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="mb-3 font-semibold tabular-nums" style={{ fontSize: '48px', color: 'var(--gray-900)', lineHeight: 1.1 }}>
              {isLoading
                ? <span className="inline-block h-12 w-40 animate-pulse rounded-lg" style={{ background: 'var(--gray-200)' }} />
                : balanceVisible
                ? displayBalance
                : '••••••'}
            </div>

            <p className="mb-8 text-xs" style={{ color: 'var(--gray-400)' }}>
              {usdc.toFixed(2)} pUSD · Polygon
            </p>

            {/* Action pills */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/fund"
                className="inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--green-600)', borderRadius: '999px' }}
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Money
              </Link>
              <Link
                href="/withdraw"
                className="inline-flex items-center gap-1.5 rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--gray-300)', color: 'var(--gray-700)', borderRadius: '999px' }}
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Withdraw
              </Link>
              <Link
                href="/markets"
                className="inline-flex items-center gap-1.5 rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--gray-300)', color: 'var(--gray-700)', borderRadius: '999px' }}
              >
                Markets →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WalletHub({ fxRate }: WalletHubProps) {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-lg">
          <div className="h-56 animate-pulse rounded-2xl" style={{ background: 'var(--gray-100)' }} />
        </div>
      </section>
    );
  }

  if (authenticated) {
    return <BalanceCard fxRate={fxRate} />;
  }

  // Marketing hero for logged-out
  return (
    <section
      className="flex flex-col items-center gap-6 px-4 py-16 text-center"
      style={{ background: 'linear-gradient(to bottom, var(--green-50), var(--gray-50))' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white"
          style={{ background: 'var(--green-600)' }}
        >
          P
        </div>
        <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--gray-900)' }}>
          predict<span style={{ color: 'var(--green-600)' }}>waves</span>
        </span>
      </div>
      <p className="max-w-sm text-lg font-medium" style={{ color: 'var(--gray-700)' }}>
        Your Naira-native wallet for Polymarket prediction markets.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <ConnectButton />
        <Link
          href="/markets"
          className="inline-flex h-9 items-center rounded-full border px-5 text-sm font-medium transition-colors hover:bg-gray-100"
          style={{ borderColor: 'var(--gray-300)', color: 'var(--gray-700)' }}
        >
          Browse markets →
        </Link>
      </div>
    </section>
  );
}
