import { createSupabaseAdmin } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';

const TTL_MS = serverEnv.FX_CACHE_TTL_SECONDS * 1000;

export interface CachedRate {
  pair: string;
  rate: number;
  fetchedAt: string;
  source: string;
  stale: boolean;
}

async function fetchFromCoinGecko(): Promise<number> {
  const res = await fetch(serverEnv.FX_SOURCE_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const json = await res.json() as Record<string, Record<string, unknown>>;
  const rate = json?.tether?.ngn;
  if (typeof rate !== 'number' || rate <= 0) throw new Error('CoinGecko returned invalid rate');
  return rate;
}

async function refreshRate(pair: string): Promise<void> {
  const admin = createSupabaseAdmin();
  const rate = await fetchFromCoinGecko();
  await admin.from('fx_cache').upsert({
    pair,
    rate,
    source: 'coingecko-tether-ngn',
    fetched_at: new Date().toISOString(),
  });
}

export async function getCachedRate(pair = 'NGN/USD'): Promise<CachedRate> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from('fx_cache').select('*').eq('pair', pair).maybeSingle();

  const now = Date.now();
  const fetchedAtMs = data ? new Date(data.fetched_at as string).getTime() : 0;
  const stale = !data || now - fetchedAtMs > TTL_MS;

  if (stale) {
    // Stale-while-revalidate: kick off refresh but return cached value immediately if available
    void refreshRate(pair).catch((e) => console.error('fx refresh failed', e));
    if (data) {
      return {
        pair,
        rate: Number(data.rate),
        fetchedAt: data.fetched_at as string,
        source: data.source as string,
        stale: true,
      };
    }
    // No cached value at all — blocking fetch
    const rate = await fetchFromCoinGecko();
    const fetchedAt = new Date().toISOString();
    await admin.from('fx_cache').upsert({
      pair,
      rate,
      source: 'coingecko-tether-ngn',
      fetched_at: fetchedAt,
    });
    return { pair, rate, fetchedAt, source: 'coingecko-tether-ngn', stale: false };
  }

  return {
    pair,
    rate: Number(data.rate),
    fetchedAt: data.fetched_at as string,
    source: data.source as string,
    stale: false,
  };
}
