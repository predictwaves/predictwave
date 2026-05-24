-- TODO: Replace placeholder condition_id values with real ones from polymarket.com.
-- Find them by browsing https://polymarket.com → click a market → copy the part of the
-- URL after /event/ — that's the slug, and the page source contains the condition_id.

insert into curated_markets (condition_id, market_slug, curator_note, category, featured_rank) values
  ('PLACEHOLDER_REPLACE_ME_001', 'us-2028-presidential-winner', 'US 2028 — top of funnel', 'politics', 1),
  ('PLACEHOLDER_REPLACE_ME_002', 'world-cup-2026-winner', 'World Cup 2026 — June/July', 'sports', 2),
  ('PLACEHOLDER_REPLACE_ME_003', 'btc-200k-2026', 'Will BTC hit $200k in 2026', 'crypto', 3),
  ('PLACEHOLDER_REPLACE_ME_004', 'fed-rate-cut-june-2026', 'Fed rate decision June 2026', 'world', 4),
  ('PLACEHOLDER_REPLACE_ME_005', 'agi-by-2030', 'AGI declared by 2030', 'world', 5),
  ('PLACEHOLDER_REPLACE_ME_006', 'eth-flippening-2027', 'ETH market cap exceeds BTC by 2027', 'crypto', 6),
  ('PLACEHOLDER_REPLACE_ME_007', 'super-bowl-2027-winner', 'Super Bowl LXI winner', 'sports', 7),
  ('PLACEHOLDER_REPLACE_ME_008', 'spacex-mars-mission-2028', 'SpaceX Mars launch by end of 2028', 'world', 8)
on conflict (condition_id) do nothing;

do $$ begin
  raise notice 'Seeded 8 curated markets with PLACEHOLDER condition_ids — replace with real Polymarket IDs before Phase 3.';
end $$;
