import { NextResponse } from 'next/server';
import { getMarket } from '@/lib/polymarket';
import { createSupabaseAdmin } from '@/lib/supabase/server';

export const revalidate = 60;

export interface TickerItem {
  conditionId: string;
  question: string;
  category: string | null;
  yesProbability: number;
}

export async function GET() {
  const supabase = createSupabaseAdmin();
  const { data: curated, error } = await supabase
    .from('curated_markets')
    .select('condition_id, category')
    .eq('hidden', false)
    .limit(60);

  if (error || !curated?.length) {
    return NextResponse.json({ items: [] });
  }

  const enriched = await Promise.all(
    curated.map(async (row) => {
      const live = await getMarket(row.condition_id as string);
      if (!live?.active || live.closed) return null;
      const yesProbability = live.outcomes[0]?.price ?? 0;
      // Real 24h change is deferred (needs per-market price history or a cached
      // baseline); we show the honest current probability only — no direction signal.
      return {
        conditionId: live.conditionId,
        question: live.question,
        category: (row.category as string | null) ?? live.category,
        yesProbability,
        volume24h: live.volume24h,
      };
    }),
  );

  const items: TickerItem[] = enriched
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 20)
    .map(({ volume24h: _volume24h, ...item }) => item);

  return NextResponse.json({ items });
}
