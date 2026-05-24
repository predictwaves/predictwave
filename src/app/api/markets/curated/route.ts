import { NextResponse } from 'next/server';
import { getMarket } from '@/lib/polymarket';
import { createSupabaseAdmin } from '@/lib/supabase/server';

export const revalidate = 30;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);

  const supabase = createSupabaseAdmin();
  let query = supabase
    .from('curated_markets')
    .select('*')
    .eq('hidden', false)
    .order('featured_rank', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (category) query = query.eq('category', category);

  const { data: curated, error } = await query;
  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  const markets = await Promise.all(
    (curated ?? []).map(async (row) => {
      const live = await getMarket(row.condition_id as string);
      if (!live) return null;
      return { ...row, ...live };
    }),
  );

  return NextResponse.json({ markets: markets.filter(Boolean) });
}
