-- supabase/migrations/0001_init.sql

create extension if not exists "pgcrypto";

-- Editor-picked Polymarket markets surfaced in the app
create table curated_markets (
  id uuid primary key default gen_random_uuid(),
  condition_id text not null unique,
  market_slug text not null,
  curator_note text,
  category text check (category in ('politics','sports','crypto','nigeria','world','other')),
  featured_rank int,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on curated_markets (featured_rank nulls last);
create index on curated_markets (category) where hidden = false;

-- Cached FX rates (NGN/USD primarily)
create table fx_cache (
  pair text primary key,
  rate numeric(18,6) not null,
  source text not null,
  fetched_at timestamptz not null default now()
);

-- Per-user display preferences
create table user_prefs (
  privy_user_id text primary key,
  display_currency text not null default 'NGN' check (display_currency in ('NGN','USD')),
  show_balance boolean not null default true,
  whatsapp_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Privy webhook event log (idempotency)
create table privy_events (
  event_id text primary key,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

-- RLS: enable on user_prefs only; service role bypasses for other tables
alter table user_prefs enable row level security;
create policy "Users can manage their own prefs"
  on user_prefs for all
  using (true)
  with check (true);
