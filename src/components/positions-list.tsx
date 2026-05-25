'use client';
import { getEmbeddedConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import Link from 'next/link';
import { type Position, usePositions } from '@/hooks/use-positions';
import { useCurrencyStore } from '@/lib/currency-store';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';

export function PositionsList({ fxRate }: { fxRate: number }) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const address = getEmbeddedConnectedWallet(wallets)?.address as `0x${string}` | undefined;
  const { data, isLoading } = usePositions(address);

  if (ready && !authenticated) {
    return <Empty>Sign in to see your positions.</Empty>;
  }
  if (isLoading || !ready) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl" style={{ background: 'var(--gray-100)' }} />
        ))}
      </div>
    );
  }

  const positions = data?.positions ?? [];
  if (positions.length === 0) {
    return <Empty>No open positions yet.</Empty>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {positions.map((p) => (
        <PositionCard key={`${p.conditionId}-${p.outcomeName}`} position={p} fxRate={fxRate} />
      ))}
    </div>
  );
}

function PositionCard({ position: p, fxRate }: { position: Position; fxRate: number }) {
  const { displayCurrency: currency } = useCurrencyStore();
  const fmt = (usdc: number) =>
    currency === 'NGN' ? formatNgn(usdcToNgn(usdc, fxRate)) : formatUsdc(usdc);

  const isYes = p.outcomeName.toLowerCase() === 'yes';
  const outcomeColor = isYes ? 'var(--green-600)' : 'var(--red-600)';
  const pnlPositive = p.pnlUsdc >= 0;
  const pnlColor = pnlPositive ? 'var(--green-600)' : 'var(--red-600)';

  return (
    <Link
      href={`/markets/${p.conditionId}`}
      className="flex flex-col gap-2 rounded-xl border p-4 transition-shadow hover:shadow-md"
      style={{ background: '#fff', borderColor: 'var(--gray-200)' }}
    >
      <p className="line-clamp-2 text-sm font-semibold" style={{ color: 'var(--gray-900)' }}>
        {p.question || 'Market'}
      </p>
      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase"
          style={{ background: isYes ? 'var(--green-50)' : 'var(--red-50)', color: outcomeColor }}
        >
          {p.outcomeName || '—'}
        </span>
        <span className="text-xs tabular-nums" style={{ color: 'var(--gray-500)' }}>
          {p.shares.toFixed(2)} shares
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px]" style={{ color: 'var(--gray-400)' }}>
            Value
          </p>
          <p className="text-base font-bold tabular-nums" style={{ color: 'var(--gray-900)' }}>
            {fmt(p.valueUsdc)}
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold tabular-nums" style={{ color: pnlColor }}>
          <span aria-hidden="true">{pnlPositive ? '▲' : '▼'}</span>
          {fmt(Math.abs(p.pnlUsdc))}
        </div>
      </div>
    </Link>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border py-12"
      style={{ borderColor: 'var(--gray-200)', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <p className="text-sm" style={{ color: 'var(--gray-400)' }}>
        {children}
      </p>
    </div>
  );
}
