import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');

  const supabase = createSupabaseAdmin();
  let query = supabase
    .from('curated_markets')
    .select('*')
    .eq('hidden', false)
    .order('featured_rank', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ markets: data });
}
