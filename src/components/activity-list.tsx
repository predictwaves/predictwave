'use client';
import { usePrivy } from '@privy-io/react-auth';
import { type Activity, useActivity } from '@/hooks/use-activity';
import { useDepositWallet } from '@/hooks/use-deposit-wallet';
import { useCurrencyStore } from '@/lib/currency-store';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';

function formatWhen(ts: number): string {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ActivityList({ fxRate }: { fxRate: number }) {
  const { ready, authenticated } = usePrivy();
  const address = useDepositWallet();
  const { data, isLoading } = useActivity(address);
  const { displayCurrency: currency } = useCurrencyStore();

  const fmt = (usdc: number) =>
    currency === 'NGN' ? formatNgn(usdcToNgn(usdc, fxRate)) : formatUsdc(usdc);

  if (ready && !authenticated) {
    return <Empty>Sign in to see your activity.</Empty>;
  }
  if (isLoading || !ready) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: 'var(--gray-100)' }} />
        ))}
      </div>
    );
  }

  const items = data?.activity ?? [];
  if (items.length === 0) {
    return <Empty>No activity yet.</Empty>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((a) => (
        <ActivityRow
          key={`${a.txHash ?? a.conditionId}-${a.timestamp}-${a.outcomeName}-${a.side ?? a.type}`}
          activity={a}
          fmt={fmt}
        />
      ))}
    </div>
  );
}

function ActivityRow({ activity: a, fmt }: { activity: Activity; fmt: (usdc: number) => string }) {
  const isBuy = (a.side ?? '').toUpperCase() === 'BUY';
  const label = a.side ? (isBuy ? 'Bought' : 'Sold') : a.type;
  const color = a.side ? (isBuy ? 'var(--green-600)' : 'var(--red-600)') : 'var(--gray-500)';

  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ background: '#fff', border: '1px solid var(--gray-200)' }}
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium" style={{ color: 'var(--gray-900)' }}>
          {a.question || 'Market'}
        </span>
        <span className="text-xs" style={{ color: 'var(--gray-500)' }}>
          <span style={{ color, fontWeight: 600 }}>{label}</span>
          {a.outcomeName ? ` ${a.outcomeName}` : ''} · {a.shares.toFixed(2)} shares
          {formatWhen(a.timestamp) ? ` · ${formatWhen(a.timestamp)}` : ''}
        </span>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: 'var(--gray-800)' }}>
        {fmt(a.valueUsdc)}
      </span>
    </div>
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
