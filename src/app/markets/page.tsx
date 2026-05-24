import { Suspense } from 'react';
import { MarketCard } from '@/components/market-card';
import { CategoryTabs } from '@/components/category-tabs';
import { MarketSearch } from '@/components/market-search';
import { PriceToggle } from '@/components/price-display';
import { Skeleton } from '@/components/ui/skeleton';
import { getCachedRate } from '@/lib/fx';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getMarket } from '@/lib/polymarket';
import type { MarketMeta } from '@/lib/polymarket';

async function fetchMarkets(category?: string): Promise<MarketMeta[]> {
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

  const markets = await Promise.all(
    data.map((row) => getMarket(row.condition_id as string)),
  );
  return markets.filter((m): m is MarketMeta => m !== null);
}

function MarketGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {([0, 1, 2, 3, 4, 5] as const).map((i) => (
        <div key={i} className="rounded-xl border p-4" style={{ borderColor: 'var(--gray-200)', background: '#fff' }}>
          <Skeleton className="mb-3 h-4 w-16 rounded-full" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-3 h-4 w-3/4" />
          <Skeleton className="mb-2 h-6 w-24" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

interface MarketsListProps {
  category: string | undefined;
  fxRate: number;
}

async function MarketsList({ category, fxRate }: MarketsListProps) {
  const markets = await fetchMarkets(category);

  if (!markets.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-base font-medium" style={{ color: 'var(--gray-500)' }}>
          No markets found{category ? ` in "${category}"` : ''}.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {markets.map((market) => (
        <MarketCard key={market.conditionId} market={market} fxRate={fxRate} />
      ))}
    </div>
  );
}

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const category = typeof sp.category === 'string' ? sp.category : undefined;
  const fxData = await getCachedRate('NGN/USD').catch(() => null);
  const fxRate = fxData?.rate ?? 1700;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>
          Markets
        </h1>
        <div className="flex items-center gap-2">
          <PriceToggle />
          <button
            type="button"
            onClick={() => {}}
            className="hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm sm:flex"
            style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-500)' }}
            aria-label="Search markets — press ⌘K"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
            <kbd className="ml-1 rounded px-1 text-[10px]" style={{ background: 'var(--gray-100)' }}>⌘K</kbd>
          </button>
        </div>
      </div>

      <Suspense fallback={<div className="mb-4 h-9 animate-pulse rounded-full bg-gray-100" />}>
        <div className="mb-6">
          <CategoryTabs />
        </div>
      </Suspense>

      <Suspense fallback={<MarketGridSkeleton />}>
        <MarketsList category={category} fxRate={fxRate} />
      </Suspense>

      <MarketSearch />
    </main>
  );
}
