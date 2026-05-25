'use client';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePriceHistory } from '@/hooks/use-price-history';
import { useCurrencyStore } from '@/lib/currency-store';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';
import type { MarketMeta } from '@/lib/polymarket';

interface FeaturedBillboardProps {
  markets: MarketMeta[];
  fxRate: number;
}

function timeLeft(isoDate: string): string {
  const ms = new Date(isoDate).getTime() - Date.now();
  if (ms < 0) return 'Ended';
  const days = Math.ceil(ms / 86_400_000);
  if (days <= 1) return 'Ends soon';
  if (days < 30) return `${days}d left`;
  return `${Math.floor(days / 30)}mo left`;
}

function resolveDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function BillboardChart({ conditionId }: { conditionId: string }) {
  const { data, isLoading } = usePriceHistory(conditionId, '1w');

  const chartData = (data?.history ?? []).map((pt) => ({
    t: pt.t,
    pct: Math.round(pt.p * 100),
  }));

  const latestPct = chartData.at(-1)?.pct;
  const gradId = `bg-${conditionId.slice(2, 10)}`;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-8 w-16 animate-pulse rounded-lg" style={{ background: 'var(--green-100)' }} />
        <div className="h-32 animate-pulse rounded-xl" style={{ background: 'var(--green-50)' }} />
      </div>
    );
  }

  return (
    <div>
      {latestPct !== undefined && (
        <div className="mb-3 flex items-baseline gap-1.5">
          <span
            className="tabular-nums"
            style={{ fontSize: '32px', fontWeight: 800, color: 'var(--green-700)', lineHeight: 1 }}
          >
            {latestPct}%
          </span>
          <span className="text-sm" style={{ color: 'var(--gray-400)' }}>YES · 7d</span>
        </div>
      )}

      {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--green-500)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--green-500)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as { pct: number } | undefined;
                if (!row) return null;
                return (
                  <div
                    className="rounded-lg border px-2 py-1 text-xs shadow"
                    style={{ background: '#fff', borderColor: 'var(--gray-200)' }}
                  >
                    YES {row.pct}%
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="pct"
              stroke="var(--green-600)"
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div
          className="flex h-28 items-center justify-center rounded-xl text-xs"
          style={{ background: 'var(--green-50)', color: 'var(--gray-400)' }}
        >
          Chart loading…
        </div>
      )}

      {/* Source mentions */}
      <div className="mt-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--gray-500)' }}>
          <span>📊</span>
          <span>Polymarket · Live order book data</span>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--gray-500)' }}>
          <span>🔗</span>
          <span>Resolves via authoritative sources</span>
        </div>
      </div>
    </div>
  );
}

interface ContentProps {
  market: MarketMeta;
  fxRate: number;
}

function BillboardContent({ market, fxRate }: ContentProps) {
  const { displayCurrency: currency } = useCurrencyStore();
  const yesOutcome = market.outcomes[0];
  const noOutcome = market.outcomes[1];
  const yesPrice = yesOutcome?.price ?? 0;
  const noPrice = noOutcome?.price ?? (1 - yesPrice);

  const yesLabel =
    currency === 'NGN'
      ? formatNgn(usdcToNgn(yesPrice, fxRate))
      : formatUsdc(yesPrice);
  const noLabel =
    currency === 'NGN'
      ? formatNgn(usdcToNgn(noPrice, fxRate))
      : formatUsdc(noPrice);

  const vol24hLabel =
    currency === 'NGN'
      ? formatNgn(usdcToNgn(market.volume24h, fxRate))
      : formatUsdc(market.volume24h);
  const volTotalLabel =
    currency === 'NGN'
      ? formatNgn(usdcToNgn(market.volumeTotal, fxRate))
      : formatUsdc(market.volumeTotal);

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:gap-10">
      {/* LEFT */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Tags */}
        <div className="flex items-center gap-1.5">
          {market.category && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: 'var(--green-50)', color: 'var(--green-700)' }}
            >
              {market.category}
            </span>
          )}
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--gray-500)' }}
          >
            Polymarket
          </span>
        </div>

        {/* Question */}
        <h2
          className="leading-snug"
          style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.3 }}
        >
          {market.question}
        </h2>

        {/* Sub line */}
        {market.endDate && (
          <p className="text-sm" style={{ color: 'var(--gray-500)' }}>
            Resolves on {resolveDate(market.endDate)} · {timeLeft(market.endDate)}
          </p>
        )}

        {/* Buy YES / NO */}
        <div className="flex gap-3">
          <Link
            href={`/markets/${market.conditionId}`}
            className="inline-flex flex-col items-center gap-0.5 rounded-xl border px-6 py-3 transition-colors hover:border-green-300 hover:bg-green-100"
            style={{ background: 'var(--green-50)', borderColor: 'var(--green-200)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--green-600)' }}>
              Buy YES
            </span>
            <span className="text-base font-bold tabular-nums" style={{ color: 'var(--green-700)' }}>
              {yesLabel}
            </span>
          </Link>
          <Link
            href={`/markets/${market.conditionId}`}
            className="inline-flex flex-col items-center gap-0.5 rounded-xl border px-6 py-3 transition-colors hover:border-red-200 hover:bg-red-50"
            style={{ background: 'var(--red-50)', borderColor: 'var(--gray-200)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--red-600)' }}>
              Buy NO
            </span>
            <span className="text-base font-bold tabular-nums" style={{ color: 'var(--red-600)' }}>
              {noLabel}
            </span>
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span className="text-xs" style={{ color: 'var(--gray-400)' }}>
            <strong style={{ color: 'var(--gray-700)' }}>{vol24hLabel}</strong> 24h vol
          </span>
          <span className="text-xs" style={{ color: 'var(--gray-400)' }}>
            <strong style={{ color: 'var(--gray-700)' }}>{volTotalLabel}</strong> total vol
          </span>
          {market.endDate && (
            <span className="text-xs" style={{ color: 'var(--gray-400)' }}>
              <strong style={{ color: 'var(--gray-700)' }}>{timeLeft(market.endDate)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* RIGHT: chart + source mentions */}
      <div className="w-full lg:w-64 lg:shrink-0">
        <BillboardChart conditionId={market.conditionId} />
      </div>
    </div>
  );
}

export function FeaturedBillboard({ markets, fxRate }: FeaturedBillboardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  const n = markets.length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: timerKey is intentionally used to restart the interval on manual navigation
  useEffect(() => {
    if (paused || n === 0) return;
    const id = setInterval(
      () => setActiveIndex((i) => (i + 1) % n),
      6000,
    );
    return () => clearInterval(id);
  }, [paused, n, timerKey]);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setTimerKey((k) => k + 1);
    },
    [],
  );

  const goPrev = useCallback(
    () => goTo((activeIndex - 1 + n) % n),
    [activeIndex, n, goTo],
  );

  const goNext = useCallback(
    () => goTo((activeIndex + 1) % n),
    [activeIndex, n, goTo],
  );

  const market = markets[activeIndex];
  if (!market || n === 0) return null;

  return (
    <section className="px-7 py-5">
      <div className="mb-3">
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}
        >
          Featured
        </p>
      </div>

      {/* Billboard card — content swaps, card stays */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <article
        className="card-iridescent group relative rounded-3xl p-8"
        style={{ minHeight: '320px' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Prev arrow */}
        {n > 1 && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
            style={{ background: '#fff', borderColor: 'var(--gray-200)', color: 'var(--gray-600)' }}
            aria-label="Previous market"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Next arrow */}
        {n > 1 && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
            style={{ background: '#fff', borderColor: 'var(--gray-200)', color: 'var(--gray-600)' }}
            aria-label="Next market"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Cross-fading content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={market.conditionId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <BillboardContent market={market} fxRate={fxRate} />
          </motion.div>
        </AnimatePresence>

        {/* Pagination dots */}
        {n > 1 && (
          <div className="mt-8 flex justify-center gap-1.5">
            {markets.map((m, i) => (
              <button
                key={m.conditionId}
                type="button"
                onClick={() => goTo(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === activeIndex ? '20px' : '6px',
                  background: i === activeIndex ? 'var(--green-600)' : 'var(--gray-300)',
                }}
                aria-label={`Go to market ${i + 1}`}
              />
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
