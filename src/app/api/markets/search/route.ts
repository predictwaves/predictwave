import { NextResponse } from 'next/server';
import { getMarket } from '@/lib/polymarket';
import { createSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json({ markets: [] });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('curated_markets')
    .select('condition_id, market_slug')
    .eq('hidden', false)
    .ilike('market_slug', `%${q.toLowerCase().replace(/\s+/g, '-')}%`)
    .limit(10);

  if (error || !data?.length) {
    return NextResponse.json({ markets: [] });
  }

  const markets = await Promise.all(
    data.map(async (row) => {
      const live = await getMarket(row.condition_id as string);
      if (!live) return null;
      return { conditionId: live.conditionId, question: live.question, category: live.category };
    }),
  );

  return NextResponse.json({ markets: markets.filter(Boolean) });
}
