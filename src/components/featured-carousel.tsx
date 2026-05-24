'use client';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useCurrencyStore } from '@/lib/currency-store';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';
import type { MarketMeta } from '@/lib/polymarket';

interface FeaturedCarouselProps {
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

function HeroCard({ market, fxRate }: { market: MarketMeta; fxRate: number }) {
  const { displayCurrency: currency } = useCurrencyStore();
  const yesOutcome = market.outcomes[0];
  const noOutcome = market.outcomes[1];
  const yesPrice = yesOutcome?.price ?? 0;
  const yesPct = Math.round(yesPrice * 100);
  const noPct = 100 - yesPct;

  const volLabel =
    currency === 'NGN'
      ? formatNgn(usdcToNgn(market.volume24h, fxRate))
      : formatUsdc(market.volume24h);

  return (
    <Link
      href={`/markets/${market.conditionId}`}
      className="card-iridescent flex flex-col gap-4 rounded-2xl p-6 h-full"
      draggable={false}
      style={{ minHeight: '260px', transition: 'box-shadow 0.2s' }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
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
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: 'var(--gray-100)', color: 'var(--gray-500)' }}
          >
            Featured
          </span>
        </div>
        {market.endDate && (
          <span className="text-xs tabular-nums" style={{ color: 'var(--gray-400)' }}>
            {timeLeft(market.endDate)}
          </span>
        )}
      </div>

      {/* Question */}
      <h2
        className="line-clamp-3 leading-snug"
        style={{ fontSize: '17px', fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.35 }}
      >
        {market.question}
      </h2>

      {/* Probability bar */}
      <div className="flex h-1.5 overflow-hidden rounded-full">
        <div
          style={{
            width: `${yesPct}%`,
            background: 'var(--green-500)',
            transition: 'width 0.5s ease',
          }}
        />
        <div className="flex-1" style={{ background: 'var(--red-500)' }} />
      </div>

      {/* Outcome rows */}
      <div className="flex flex-col gap-1.5">
        <div
          className="flex items-center justify-between rounded-xl px-4 py-2"
          style={{ background: 'rgba(209,250,229,0.5)', border: '1px solid var(--green-200)' }}
        >
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--green-500)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--gray-700)' }}>
              {yesOutcome?.name ?? 'YES'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums" style={{ color: 'var(--gray-500)' }}>
              {currency === 'NGN'
                ? formatNgn(usdcToNgn(yesPrice, fxRate))
                : formatUsdc(yesPrice)}
            </span>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: 'var(--green-700)', minWidth: '2.5rem', textAlign: 'right' }}
            >
              {yesPct}%
            </span>
          </div>
        </div>

        <div
          className="flex items-center justify-between rounded-xl px-4 py-2"
          style={{ background: 'rgba(254,226,226,0.4)', border: '1px solid var(--gray-200)' }}
        >
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--red-500)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--gray-700)' }}>
              {noOutcome?.name ?? 'NO'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums" style={{ color: 'var(--gray-500)' }}>
              {currency === 'NGN'
                ? formatNgn(usdcToNgn(1 - yesPrice, fxRate))
                : formatUsdc(1 - yesPrice)}
            </span>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: 'var(--red-600)', minWidth: '2.5rem', textAlign: 'right' }}
            >
              {noPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs" style={{ color: 'var(--gray-400)' }}>
          {volLabel} 24h vol
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--green-600)' }}
        >
          Polymarket
        </span>
      </div>
    </Link>
  );
}

export function FeaturedCarousel({ markets, fxRate }: FeaturedCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (markets.length === 0) return null;

  return (
    <section className="py-5">
      <div className="flex items-center justify-between px-7 mb-3">
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}
        >
          Featured
        </p>
      </div>

      {/* Embla viewport + arrow overlay wrapper */}
      <div className="relative group">
        <div ref={emblaRef} className="overflow-hidden px-7">
          <div className="flex gap-4">
            {markets.map((market) => (
              <div
                key={market.conditionId}
                className="flex-none"
                style={{ width: 'min(360px, 82vw)' }}
              >
                <HeroCard market={market} fxRate={fxRate} />
              </div>
            ))}
          </div>
        </div>

        {/* Previous arrow */}
        {markets.length > 1 && (
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-opacity duration-200 opacity-0 group-hover:opacity-100"
            style={{ background: '#fff', borderColor: 'var(--gray-200)', color: 'var(--gray-600)' }}
            aria-label="Previous slide"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Next arrow */}
        {markets.length > 1 && (
          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-opacity duration-200 opacity-0 group-hover:opacity-100"
            style={{ background: '#fff', borderColor: 'var(--gray-200)', color: 'var(--gray-600)' }}
            aria-label="Next slide"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Pagination dots */}
      {markets.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {markets.map((market, i) => (
            <button
              key={market.conditionId}
              type="button"
              onClick={() => scrollTo(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === selectedIndex ? '20px' : '6px',
                background: i === selectedIndex ? 'var(--green-600)' : 'var(--gray-200)',
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
