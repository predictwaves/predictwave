'use client';
import { usePrivy } from '@privy-io/react-auth';
import { type Activity, useActivity } from '@/hooks/use-activity';
import { useDepositWallet } from '@/hooks/use-deposit-wallet';
import { useCurrencyStore } from '@/lib/currency-store';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';

function formatWhen(ts: number): string {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TransactionHistory({ fxRate }: { fxRate: number }) {
  const { ready, authenticated } = usePrivy();
  const address = useDepositWallet();
  const { data, isLoading } = useActivity(address);
  const { displayCurrency: currency } = useCurrencyStore();

  const fmt = (usdc: number) =>
    currency === 'NGN' ? formatNgn(usdcToNgn(usdc, fxRate)) : formatUsdc(usdc);

  if (ready && !authenticated) {
    return <Empty>Sign in to see your transaction history.</Empty>;
  }
  if (isLoading || !ready) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl" style={{ background: 'var(--gray-100)' }} />
        ))}
      </div>
    );
  }

  const items = data?.activity ?? [];
  if (items.length === 0) {
    return <Empty>No transactions yet.</Empty>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((a) => (
        <TradeRow
          key={`${a.txHash ?? a.conditionId}-${a.timestamp}-${a.outcomeName}-${a.side ?? a.type}`}
          trade={a}
          fmt={fmt}
        />
      ))}
    </div>
  );
}

function TradeRow({ trade: a, fmt }: { trade: Activity; fmt: (usdc: number) => string }) {
  const isBuy = (a.side ?? '').toUpperCase() === 'BUY';
  const action = a.side ? (isBuy ? 'Buy' : 'Sell') : a.type;
  const actionColor = a.side ? (isBuy ? 'var(--green-600)' : 'var(--red-600)') : 'var(--gray-500)';

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
      style={{ background: '#fff', border: '1px solid var(--gray-200)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium" style={{ color: 'var(--gray-900)' }}>
          {a.question || 'Market'}
        </span>
        <span className="text-xs" style={{ color: 'var(--gray-500)' }}>
          <span style={{ color: actionColor, fontWeight: 600 }}>
            {action}
            {a.outcomeName ? ` ${a.outcomeName}` : ''}
          </span>
          {' · '}
          {a.shares.toFixed(2)} shares
          {formatWhen(a.timestamp) ? ` · ${formatWhen(a.timestamp)}` : ''}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--gray-900)' }}>
          {fmt(a.valueUsdc)}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: 'var(--green-50)', color: 'var(--green-700)' }}
        >
          Filled
        </span>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16 text-center"
      style={{ border: '1px dashed var(--gray-200)', background: 'var(--gray-50)' }}
    >
      <p className="text-sm font-medium" style={{ color: 'var(--gray-500)' }}>
        {children}
      </p>
    </div>
  );
}
