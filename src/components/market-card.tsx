'use client';
import Link from 'next/link';
import { useCurrency } from '@/lib/currency-context';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';
import type { MarketMeta } from '@/lib/polymarket';

function daysUntil(isoDate: string): string {
  const ms = new Date(isoDate).getTime() - Date.now();
  if (ms < 0) return 'ended';
  const days = Math.ceil(ms / 86_400_000);
  if (days === 0) return 'ends today';
  if (days === 1) return 'ends tomorrow';
  if (days < 30) return `ends in ${days}d`;
  const months = Math.floor(days / 30);
  return `ends in ${months}mo`;
}

interface MarketCardProps {
  market: MarketMeta;
  fxRate?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  politics: 'var(--amber-700)',
  sports: 'var(--green-700)',
  crypto: '#7c3aed',
  nigeria: 'var(--green-600)',
  world: 'var(--gray-500)',
  other: 'var(--gray-400)',
};

export function MarketCard({ market, fxRate = 1700 }: MarketCardProps) {
  const { currency } = useCurrency();
  const yesPrice = market.outcomes[0]?.price ?? 0;
  const yesPct = Math.round(yesPrice * 100);

  const priceLabel =
    currency === 'NGN'
      ? formatNgn(usdcToNgn(yesPrice, fxRate))
      : formatUsdc(yesPrice);

  const volumeLabel =
    currency === 'NGN'
      ? `${formatNgn(usdcToNgn(market.volume24h, fxRate))} 24h vol`
      : `${formatUsdc(market.volume24h)} 24h vol`;

  return (
    <Link
      href={`/markets/${market.conditionId}`}
      className="group flex flex-col gap-3 rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: '#fff',
        borderColor: 'var(--gray-200)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--green-200)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--gray-200)';
      }}
    >
      {/* Category badge */}
      {market.category && (
        <span
          className="self-start rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{
            background: 'var(--gray-100)',
            color: CATEGORY_COLORS[market.category] ?? 'var(--gray-500)',
          }}
        >
          {market.category}
        </span>
      )}

      {/* Question */}
      <p
        className="line-clamp-2 text-sm font-medium leading-snug"
        style={{ color: 'var(--gray-900)' }}
      >
        {market.question}
      </p>

      {/* YES price */}
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold" style={{ color: 'var(--green-600)' }}>
          {priceLabel}
        </span>
        <span className="text-sm font-semibold" style={{ color: 'var(--gray-500)' }}>
          YES {yesPct}%
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--gray-400)' }}>
        <span>{volumeLabel}</span>
        {market.endDate && <span>{daysUntil(market.endDate)}</span>}
      </div>
    </Link>
  );
}
