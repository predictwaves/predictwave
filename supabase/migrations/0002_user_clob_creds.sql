create table user_clob_creds (
  privy_user_id text primary key,
  wallet_address text not null,
  encrypted_key text not null,
  encrypted_secret text not null,
  encrypted_passphrase text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on user_clob_creds (wallet_address);

alter table user_clob_creds enable row level security;
comment on table user_clob_creds is 'Encrypted per-user Polymarket CLOB API credentials. Access restricted to service role only.';
