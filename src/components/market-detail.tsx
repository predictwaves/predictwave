'use client';
import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCurrencyStore } from '@/lib/currency-store';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';
import type { MarketMeta } from '@/lib/polymarket';
import { useFxRate } from '@/hooks/use-fx-rate';
import type { HistoryInterval } from '@/hooks/use-price-history';
import { usePriceHistory } from '@/hooks/use-price-history';
import type { OrderBookSummary } from '@polymarket/clob-client';

const INTERVALS: { label: string; value: HistoryInterval }[] = [
  { label: '1H', value: '1h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: 'ALL', value: 'all' },
];

const CATEGORY_LABEL: Record<string, string> = {
  politics: 'Politics',
  sports: 'Sports',
  crypto: 'Crypto',
  nigeria: 'Nigeria',
  world: 'World',
  other: 'Other',
};

function daysUntil(isoDate: string): string {
  const ms = new Date(isoDate).getTime() - Date.now();
  if (ms < 0) return 'ended';
  const days = Math.ceil(ms / 86_400_000);
  if (days === 0) return 'ends today';
  if (days === 1) return 'ends tomorrow';
  return `ends in ${days}d`;
}

function formatTs(t: number): string {
  const d = new Date(t * 1000);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface PriceChartProps {
  conditionId: string;
  fxRate: number;
}

function PriceChart({ conditionId, fxRate }: PriceChartProps) {
  const [interval, setInterval] = useState<HistoryInterval>('1d');
  const { data, isLoading } = usePriceHistory(conditionId, interval);
  const { displayCurrency: currency } = useCurrencyStore();

  const chartData = (data?.history ?? []).map((pt) => ({
    t: pt.t,
    pct: Math.round(pt.p * 100),
    priceRaw: pt.p,
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {INTERVALS.map((iv) => (
          <button
            key={iv.value}
            type="button"
            onClick={() => setInterval(iv.value)}
            className="rounded px-2.5 py-1 text-xs font-semibold transition-colors"
            style={
              interval === iv.value
                ? { background: 'var(--green-600)', color: '#fff' }
                : { background: 'var(--gray-100)', color: 'var(--gray-600)' }
            }
          >
            {iv.label}
          </button>
        ))}
      </div>

      <div className="h-52 w-full">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm" style={{ color: 'var(--gray-400)' }}>
            Loading chart…
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm" style={{ color: 'var(--gray-400)' }}>
            No price history available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
              <XAxis
                dataKey="t"
                tickFormatter={formatTs}
                tick={{ fontSize: 10, fill: 'var(--gray-400)' }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 10, fill: 'var(--gray-400)' }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                width={34}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const pt = payload[0]?.payload as { pct: number; priceRaw: number; t: number } | undefined;
                  if (!pt) return null;
                  const displayVal =
                    currency === 'NGN'
                      ? formatNgn(usdcToNgn(pt.priceRaw, fxRate))
                      : formatUsdc(pt.priceRaw);
                  return (
                    <div
                      className="rounded-lg border px-3 py-2 text-xs shadow"
                      style={{ background: '#fff', borderColor: 'var(--gray-200)' }}
                    >
                      <div className="font-semibold" style={{ color: 'var(--gray-900)' }}>
                        YES {pt.pct}%
                      </div>
                      <div style={{ color: 'var(--gray-500)' }}>{displayVal} / share</div>
                      <div style={{ color: 'var(--gray-400)' }}>{formatTs(pt.t)}</div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="pct"
                stroke="var(--green-600)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function OrderbookPreview({ orderbook }: { orderbook: OrderBookSummary | null }) {
  if (!orderbook) {
    return (
      <div className="text-sm" style={{ color: 'var(--gray-400)' }}>
        Orderbook unavailable.
      </div>
    );
  }

  const topBids = orderbook.bids.slice(0, 5);
  const topAsks = orderbook.asks.slice(0, 5);

  return (
    <div className="grid grid-cols-2 gap-4 text-xs">
      <div>
        <div className="mb-1.5 font-semibold" style={{ color: 'var(--green-700)' }}>YES bids</div>
        <div className="flex justify-between pb-1 text-[10px] font-medium uppercase" style={{ color: 'var(--gray-400)' }}>
          <span>Price</span><span>Size</span>
        </div>
        {topBids.map((b) => (
          <div key={b.price} className="flex justify-between py-0.5" style={{ color: 'var(--gray-700)' }}>
            <span style={{ color: 'var(--green-600)' }}>${Number(b.price).toFixed(3)}</span>
            <span>{Number(b.size).toFixed(0)}</span>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-1.5 font-semibold" style={{ color: 'var(--red-600)' }}>NO bids</div>
        <div className="flex justify-between pb-1 text-[10px] font-medium uppercase" style={{ color: 'var(--gray-400)' }}>
          <span>Price</span><span>Size</span>
        </div>
        {topAsks.map((a) => (
          <div key={a.price} className="flex justify-between py-0.5" style={{ color: 'var(--gray-700)' }}>
            <span style={{ color: 'var(--red-600)' }}>${Number(a.price).toFixed(3)}</span>
            <span>{Number(a.size).toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MarketDetailProps {
  market: MarketMeta;
  orderbook: OrderBookSummary | null;
}

export function MarketDetail({ market, orderbook }: MarketDetailProps) {
  const { displayCurrency: currency } = useCurrencyStore();
  const { data: fx } = useFxRate();
  const fxRate = fx?.rate ?? 1700;
  const [descOpen, setDescOpen] = useState(false);

  const yesPrice = market.outcomes[0]?.price ?? 0;
  const yesPct = Math.round(yesPrice * 100);

  const totalVolumeLabel =
    currency === 'NGN'
      ? formatNgn(usdcToNgn(market.volumeTotal, fxRate))
      : formatUsdc(market.volumeTotal);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Main column */}
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {market.category && (
                <span
                  className="rounded-full px-3 py-0.5 text-xs font-semibold uppercase"
                  style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}
                >
                  {CATEGORY_LABEL[market.category] ?? market.category}
                </span>
              )}
              {market.endDate && (
                <span
                  className="rounded-full border px-3 py-0.5 text-xs font-medium"
                  style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-500)' }}
                >
                  {daysUntil(market.endDate)}
                </span>
              )}
            </div>
            <h1 className="text-2xl leading-snug" style={{ color: 'var(--gray-900)', fontWeight: 800 }}>
              {market.question}
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              {/* YES price card */}
              <div
                className="flex flex-col gap-0.5 rounded-xl border px-5 py-3"
                style={{ background: 'var(--green-50)', borderColor: 'var(--green-200)' }}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--green-700)', letterSpacing: '0.08em' }}
                >
                  YES
                </span>
                <span
                  className="tabular-nums"
                  style={{ fontSize: '26px', fontWeight: 800, color: 'var(--green-700)', lineHeight: 1 }}
                >
                  {yesPct}%
                </span>
                <span className="text-xs tabular-nums" style={{ color: 'var(--green-600)' }}>
                  {currency === 'NGN'
                    ? formatNgn(usdcToNgn(yesPrice, fxRate))
                    : formatUsdc(yesPrice)}{' '}
                  / share
                </span>
              </div>
              {/* NO price card */}
              <div
                className="flex flex-col gap-0.5 rounded-xl border px-5 py-3"
                style={{ background: 'var(--red-50)', borderColor: 'var(--gray-200)' }}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--red-700)', letterSpacing: '0.08em' }}
                >
                  NO
                </span>
                <span
                  className="tabular-nums"
                  style={{ fontSize: '26px', fontWeight: 800, color: 'var(--red-600)', lineHeight: 1 }}
                >
                  {100 - yesPct}%
                </span>
                <span className="text-xs" style={{ color: 'var(--red-600)' }}>
                  {currency === 'NGN'
                    ? formatNgn(usdcToNgn(1 - yesPrice, fxRate))
                    : formatUsdc(1 - yesPrice)}{' '}
                  / share
                </span>
              </div>
              <span className="text-sm ml-auto" style={{ color: 'var(--gray-400)' }}>
                Total vol: {totalVolumeLabel}
              </span>
            </div>
          </div>

          <div
            className="rounded-xl border p-4"
            style={{ background: '#fff', borderColor: 'var(--gray-200)' }}
          >
            <PriceChart conditionId={market.conditionId} fxRate={fxRate} />
          </div>

          <div
            className="rounded-xl border p-4"
            style={{ background: '#fff', borderColor: 'var(--gray-200)' }}
          >
            <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--gray-700)' }}>
              Order book (top 5)
            </h2>
            <OrderbookPreview orderbook={orderbook} />
          </div>

          {market.description && (
            <div
              className="rounded-xl border p-4"
              style={{ background: '#fff', borderColor: 'var(--gray-200)' }}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between text-sm font-semibold"
                style={{ color: 'var(--gray-700)' }}
                onClick={() => setDescOpen((o) => !o)}
              >
                Resolution criteria
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform"
                  style={{ transform: descOpen ? 'rotate(180deg)' : '' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {descOpen && (
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--gray-600)' }}>
                  {market.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Side column: order panel placeholder */}
        <div
          className="w-full rounded-xl border p-6 lg:w-72 lg:shrink-0"
          style={{ background: 'var(--gray-50)', borderColor: 'var(--gray-200)', borderStyle: 'dashed' }}
        >
          <p className="text-center text-sm font-medium" style={{ color: 'var(--gray-400)' }}>
            Order panel — Phase 4
          </p>
          <p className="mt-2 text-center text-xs" style={{ color: 'var(--gray-300)' }}>
            Buy/sell YES or NO shares here.
          </p>
        </div>
      </div>
    </div>
  );
}
