import Link from 'next/link';
import { MarketCard } from '@/components/market-card';
import { WalletHub } from '@/components/wallet-hub';
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
    description: 'Sign up with your email or Google. A Polygon wallet is created for you automatically.',
  },
  {
    step: '2',
    title: 'Fund your wallet',
    description: 'Buy USDC via Yellow Card, Fonbnk, Bybit, or Luno and send to your wallet address.',
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
    <>
      {/* WalletHub: shows balance card when logged in, hero when logged out */}
      <WalletHub fxRate={fxRate} />

      {/* Featured markets */}
      {featuredMarkets.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>
              Featured markets
            </h2>
            <Link href="/markets" className="text-sm font-medium" style={{ color: 'var(--green-600)' }}>
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

      {/* How it works — always visible */}
      <section className="px-4 py-14" style={{ background: '#fff' }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-lg font-bold" style={{ color: 'var(--gray-900)' }}>
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="flex flex-col gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: 'var(--green-600)' }}
                >
                  {s.step}
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--gray-900)' }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-600)' }}>
                  {s.description}
                </p>
                {s.href && (
                  <Link href={s.href} className="text-sm font-medium" style={{ color: 'var(--green-600)' }}>
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
    </>
  );
}
