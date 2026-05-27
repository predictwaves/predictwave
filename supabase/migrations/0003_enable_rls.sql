-- supabase/migrations/0003_enable_rls.sql
--
-- These tables are only ever accessed server-side via the service role (which bypasses
-- RLS). With RLS DISABLED, the public anon key could still read/write them directly
-- through Supabase's REST API. Enable RLS with no policies so the anon/authenticated
-- roles are denied while the service-role app continues to work unchanged.
--
-- (If curated_markets reads ever move client-side via the anon key, add:
--    create policy "public read" on curated_markets for select using (true);
--  and keep writes denied.)

alter table curated_markets enable row level security;
alter table fx_cache enable row level security;
alter table privy_events enable row level security;
