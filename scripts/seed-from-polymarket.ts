// Run with: node --env-file=.env.local --import=tsx/esm scripts/seed-from-polymarket.ts
// Or:       pnpm dlx tsx --env-file .env.local scripts/seed-from-polymarket.ts
import { createClient } from '@supabase/supabase-js';
import { classifyCategory } from '../src/lib/polymarket';

// The CLOB markets endpoint returns zero volume and mostly point-spread sports markets.
// The Gamma API exposes real volume24hr and supports ordering, so it's the right source
// for a "top by 24h volume" curated feed. (Read pages still use clob-client.)
interface GammaMarket {
  conditionId: string;
  question: string;
  volume24hr: number;
  active: boolean;
  closed: boolean;
}

async function fetchTopMarkets(limit: number): Promise<GammaMarket[]> {
  const url =
    `https://gamma-api.polymarket.com/markets?limit=${limit}` +
    '&order=volume24hr&ascending=false&active=true&closed=false&archived=false';
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Gamma fetch failed: ${res.status}`);
  const json = (await res.json()) as unknown;
  const arr = (Array.isArray(json) ? json : []) as Record<string, unknown>[];
  return arr.map((m) => ({
    conditionId: String(m.conditionId ?? ''),
    question: String(m.question ?? ''),
    volume24hr: Number(m.volume24hr ?? 0),
    active: Boolean(m.active),
    closed: Boolean(m.closed),
  }));
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Heuristic: drop NBA (and similar) point-spread markets — "Team vs. Team" with a
// numeric line, or anything explicitly about a spread/cover. These clutter the feed.
function isPointSpread(question: string): boolean {
  const q = question.toLowerCase();
  if (/\bspread\b|\bcover\b/.test(q)) return true;
  return /\bvs\.?\b/.test(q) && /[+-]\d+(\.\d+)?/.test(q);
}

const slugify = (q: string) =>
  q
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

async function main() {
  console.log('Fetching top Polymarket markets by 24h volume (Gamma API)…');
  // Over-fetch so we still land ~50 after dropping point-spreads/zero-volume.
  const markets = await fetchTopMarkets(120);

  const curated = markets
    .filter((m) => m.conditionId && m.active && !m.closed && m.volume24hr > 0 && !isPointSpread(m.question))
    .slice(0, 50);
  console.log(`Got ${markets.length}; ${curated.length} after filtering.`);

  if (curated.length === 0) {
    console.error('No markets passed filtering — aborting without touching the table.');
    process.exit(1);
  }

  const rows = curated.map((m, index) => ({
    condition_id: m.conditionId,
    market_slug: slugify(m.question),
    curator_note: null,
    category: classifyCategory(m.question),
    featured_rank: index < 8 ? index + 1 : null, // top 8 featured
    hidden: false,
  }));

  // Replace the whole set: delete all existing rows, then insert the fresh batch. The
  // fetch above is validated first so we never leave the table empty on a fetch failure.
  console.log('Deleting existing curated_markets rows…');
  const { error: delError } = await supabase
    .from('curated_markets')
    .delete()
    .neq('condition_id', '');
  if (delError) {
    console.error('Delete failed:', delError.message);
    process.exit(1);
  }

  const { error: insError } = await supabase.from('curated_markets').insert(rows);
  if (insError) {
    console.error('Insert failed:', insError.message);
    process.exit(1);
  }
  console.log(`Inserted ${rows.length} markets (top 8 featured). Done.`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
