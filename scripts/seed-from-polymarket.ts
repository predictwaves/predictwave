// Run with: node --env-file=.env.local --import=tsx/esm scripts/seed-from-polymarket.ts
// Or:       pnpm dlx tsx --env-file .env.local scripts/seed-from-polymarket.ts
import { createClient } from '@supabase/supabase-js';
import { getTopMarketsByVolume } from '../src/lib/polymarket';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('Fetching top 50 Polymarket markets by 24h volume…');
  const markets = await getTopMarketsByVolume(50);
  console.log(`Got ${markets.length} markets. Upserting into curated_markets…`);

  for (const [index, m] of markets.entries()) {
    const slug = m.question
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);

    const { error } = await supabase.from('curated_markets').upsert(
      {
        condition_id: m.conditionId,
        market_slug: slug,
        curator_note: null,
        category: m.category,
        featured_rank: index < 12 ? index + 1 : null,
        hidden: false,
      },
      { onConflict: 'condition_id' },
    );
    if (error) {
      console.error(`Upsert failed for ${m.conditionId}:`, error.message);
    } else {
      console.log(`  [${index + 1}] ${slug}`);
    }
  }
  console.log('Done.');
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
