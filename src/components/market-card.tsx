'use client';
import Link from 'next/link';
import { useCurrencyStore } from '@/lib/currency-store';
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
  featured?: boolean;
}

export function MarketCard({ market, fxRate = 1700, featured = false }: MarketCardProps) {
  const { displayCurrency: currency } = useCurrencyStore();
  const yesPrice = market.outcomes[0]?.price ?? 0;
  const noPrice = market.outcomes[1]?.price ?? (1 - yesPrice);
  const yesPct = Math.round(yesPrice * 100);
  const noPct = Math.round(noPrice * 100);

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
        borderLeft: featured ? '3px solid var(--green-600)' : undefined,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--green-200)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = featured ? 'var(--green-600)' : 'var(--gray-200)';
      }}
    >
      {/* Tags row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {market.category && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: 'var(--gray-100)', color: 'var(--gray-500)' }}
          >
            {market.category}
          </span>
        )}
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: 'var(--green-50)', color: 'var(--green-700)' }}
        >
          Polymarket
        </span>
      </div>

      {/* Question */}
      <p
        className="line-clamp-2 text-sm leading-snug"
        style={{ color: 'var(--gray-900)', fontWeight: 600 }}
      >
        {market.question}
      </p>

      {/* Volume */}
      <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
        {volumeLabel}
        {market.endDate && <> · {daysUntil(market.endDate)}</>}
      </p>

      {/* YES / NO mini buttons */}
      <div className="flex items-center gap-2 mt-auto">
        <div
          className="flex flex-col items-center gap-0.5 rounded-lg border px-3 py-1.5"
          style={{ background: 'var(--green-50)', borderColor: 'var(--green-200)' }}
        >
          <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--gray-500)' }}>YES</span>
          <span className="text-[13px] font-bold tabular-nums" style={{ color: 'var(--green-700)' }}>{yesPct}%</span>
        </div>
        <div
          className="flex flex-col items-center gap-0.5 rounded-lg border px-3 py-1.5"
          style={{ background: 'var(--red-50)', borderColor: 'var(--gray-200)' }}
        >
          <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--gray-500)' }}>NO</span>
          <span className="text-[13px] font-bold tabular-nums" style={{ color: 'var(--red-600)' }}>{noPct}%</span>
        </div>
      </div>
    </Link>
  );
}
