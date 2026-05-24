import { Suspense } from 'react';
import { MarketCard } from '@/components/market-card';
import { CategoryTabs } from '@/components/category-tabs';
import { getCachedRate } from '@/lib/fx';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getMarket } from '@/lib/polymarket';
import type { MarketMeta } from '@/lib/polymarket';

async function getFeaturedMarkets(): Promise<MarketMeta[]> {
  try {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from('curated_markets')
      .select('condition_id')
      .eq('hidden', false)
      .not('featured_rank', 'is', null)
      .order('featured_rank', { ascending: true })
      .limit(6);

    if (!data?.length) return [];
    const markets = await Promise.all(data.map((r) => getMarket(r.condition_id as string)));
    return markets.filter((m): m is MarketMeta => m !== null);
  } catch {
    return [];
  }
}

async function getMarkets(category?: string): Promise<MarketMeta[]> {
  try {
    const supabase = createSupabaseAdmin();
    let query = supabase
      .from('curated_markets')
      .select('condition_id')
      .eq('hidden', false)
      .order('featured_rank', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(50);
    if (category) query = query.eq('category', category);
    const { data } = await query;
    if (!data?.length) return [];
    const markets = await Promise.all(data.map((r) => getMarket(r.condition_id as string)));
    return markets.filter((m): m is MarketMeta => m !== null);
  } catch {
    return [];
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const category = typeof sp.category === 'string' ? sp.category : undefined;

  const [featuredMarkets, allMarkets, fxData] = await Promise.all([
    category ? Promise.resolve([]) : getFeaturedMarkets(),
    getMarkets(category),
    getCachedRate('NGN/USD').catch(() => null),
  ]);
  const fxRate = fxData?.rate ?? 1700;

  return (
    <>
      {/* Category chips */}
      <div className="px-7 pt-5 pb-4 border-b" style={{ borderColor: 'var(--gray-100)' }}>
        <Suspense fallback={<div className="h-8 animate-pulse rounded-full bg-gray-100 w-64" />}>
          <CategoryTabs />
        </Suspense>
      </div>

      {/* Featured carousel — only when no category filter active */}
      {featuredMarkets.length > 0 && (
        <section className="py-5">
          <div className="flex items-center justify-between px-7 mb-3">
            <p
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}
            >
              Featured
            </p>
          </div>
          <div
            className="flex gap-4 overflow-x-auto px-7 pb-3"
            style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
          >
            {featuredMarkets.map((market) => (
              <div
                key={market.conditionId}
                className="shrink-0 w-[300px] sm:w-[340px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <MarketCard market={market} fxRate={fxRate} featured />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All / filtered markets grid */}
      <section className="px-7 py-6">
        <div className="flex items-center justify-between mb-5">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}
          >
            {category ? `${category} markets` : 'Trending in Nigeria'}
          </p>
        </div>

        {allMarkets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-base font-medium" style={{ color: 'var(--gray-400)' }}>
              No markets found{category ? ` in "${category}"` : ''}.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allMarkets.map((market) => (
              <MarketCard key={market.conditionId} market={market} fxRate={fxRate} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer
        className="border-t px-7 py-8 text-center text-xs"
        style={{ borderColor: 'var(--gray-100)', color: 'var(--gray-400)' }}
      >
        <p>
          PredictWaves · Powered by{' '}
          <a href="https://polygon.technology" className="underline" target="_blank" rel="noopener noreferrer">
            Polygon
          </a>
          {' '}·{' '}
          <a href="https://polymarket.com" className="underline" target="_blank" rel="noopener noreferrer">
            Polymarket
          </a>
        </p>
      </footer>
    </>
  );
}
