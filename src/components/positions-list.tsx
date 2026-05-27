'use client';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useDepositWallet } from '@/hooks/use-deposit-wallet';
import { type Position, usePositions } from '@/hooks/use-positions';
import { useCurrencyStore } from '@/lib/currency-store';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';

export function PositionsList({ fxRate }: { fxRate: number }) {
  const { ready, authenticated } = usePrivy();
  // Positions are held by the deposit wallet (the order maker), not the signing EOA.
  const address = useDepositWallet();
  const { data, isLoading } = usePositions(address);
  const { displayCurrency: currency } = useCurrencyStore();

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

  const totalValue = positions.reduce((sum, p) => sum + p.valueUsdc, 0);
  const totalLabel =
    currency === 'NGN' ? formatNgn(usdcToNgn(totalValue, fxRate)) : formatUsdc(totalValue);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex items-baseline justify-between rounded-xl px-4 py-3.5"
        style={{ background: 'var(--green-50)', border: '1px solid var(--green-100)' }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--gray-500)', letterSpacing: '0.08em' }}
        >
          Total portfolio value
        </span>
        <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--gray-900)' }}>
          {totalLabel}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {positions.map((p) => (
          <PositionCard key={`${p.conditionId}-${p.outcomeName}`} position={p} fxRate={fxRate} />
        ))}
      </div>
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
