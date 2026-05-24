import Link from 'next/link';
import { MarketCard } from '@/components/market-card';
import { ConnectButton } from '@/components/connect-button';
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

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Connect',
    description: 'Sign up with your email or Google account. A Polygon wallet is created for you automatically.',
  },
  {
    step: '2',
    title: 'Fund your wallet',
    description: 'Buy USDC using Yellow Card, Fonbnk, Bybit, or Luno and send it to your wallet address.',
    href: '/fund',
  },
  {
    step: '3',
    title: 'Trade',
    description: 'Browse curated Polymarket markets displayed in Naira and buy YES or NO shares.',
    href: '/markets',
  },
];

export default async function HomePage() {
  const [featuredMarkets, fxData] = await Promise.all([
    getFeaturedMarkets(),
    getCachedRate('NGN/USD').catch(() => null),
  ]);
  const fxRate = fxData?.rate ?? 1700;

  return (
    <main>
      {/* Hero */}
      <section
        className="flex flex-col items-center gap-6 px-4 py-20 text-center"
        style={{ background: 'linear-gradient(to bottom, var(--green-50), var(--gray-50))' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white"
            style={{ background: 'var(--green-600)' }}
          >
            P
          </div>
          <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--gray-900)' }}>
            predict<span style={{ color: 'var(--green-600)' }}>waves</span>
          </span>
        </div>
        <p className="max-w-md text-xl font-medium" style={{ color: 'var(--gray-700)' }}>
          Polymarket prediction markets — displayed in Naira.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ConnectButton />
          <Link
            href="/markets"
            className="inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-gray-100"
            style={{ borderColor: 'var(--gray-300)', color: 'var(--gray-700)' }}
          >
            Browse markets →
          </Link>
        </div>
      </section>

      {/* Featured markets */}
      {featuredMarkets.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>
              Featured markets
            </h2>
            <Link
              href="/markets"
              className="text-sm font-medium"
              style={{ color: 'var(--green-600)' }}
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredMarkets.map((market) => (
              <MarketCard key={market.conditionId} market={market} fxRate={fxRate} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section
        className="px-4 py-16"
        style={{ background: '#fff' }}
      >
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-xl font-bold" style={{ color: 'var(--gray-900)' }}>
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="flex flex-col gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: 'var(--green-600)' }}
                >
                  {step.step}
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--gray-900)' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-600)' }}>
                  {step.description}
                </p>
                {step.href && (
                  <Link href={step.href} className="text-sm font-medium" style={{ color: 'var(--green-600)' }}>
                    Get started →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t px-4 py-8 text-center text-xs"
        style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-400)' }}
      >
        <p>
          PredictWaves · Powered by{' '}
          <a href="https://polygon.technology" className="underline" target="_blank" rel="noopener noreferrer">
            Polygon
          </a>{' '}
          ·{' '}
          <a href="https://polymarket.com" className="underline" target="_blank" rel="noopener noreferrer">
            Polymarket
          </a>
        </p>
      </footer>
    </main>
  );
}
