import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  clientEnv: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_PRIVY_APP_ID: 'test-privy-app-id-123456789012345',
    NEXT_PUBLIC_POLYGON_RPC: 'https://polygon.example.com',
    NEXT_PUBLIC_POLYMARKET_CHAIN_ID: 137,
    NEXT_PUBLIC_POSTHOG_HOST: 'https://eu.i.posthog.com',
    NEXT_PUBLIC_SUPPORT_EMAIL: 'support@predictwaves.com',
  },
  serverEnv: {
    POLYMARKET_API_HOST: 'https://clob.polymarket.com',
    POLYMARKET_API_KEY: 'test-key',
    POLYMARKET_API_SECRET: 'test-secret',
    POLYMARKET_API_PASSPHRASE: 'test-passphrase',
    PRIVY_APP_SECRET: 'privy_app_secret_test12345678901234567890123456789012345678901234',
    ALCHEMY_API_KEY: 'test-alchemy',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
    FX_SOURCE_URL: 'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=ngn',
    FX_CACHE_TTL_SECONDS: 300,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

import { classifyCategory } from '@/lib/polymarket';

describe('classifyCategory', () => {
  it('classifies election questions as politics', () => {
    expect(classifyCategory('Will Biden win the 2028 election?')).toBe('politics');
    expect(classifyCategory('Who wins the presidential race?')).toBe('politics');
    expect(classifyCategory('Next UK parliament composition')).toBe('politics');
  });

  it('classifies sports questions correctly', () => {
    expect(classifyCategory('Who wins the Super Bowl in 2026?')).toBe('sports');
    expect(classifyCategory('Will Real Madrid win the Champions League?')).toBe('sports');
    expect(classifyCategory('NBA Finals winner 2026')).toBe('sports');
  });

  it('classifies crypto questions correctly', () => {
    expect(classifyCategory('Will Bitcoin reach $200k by end of 2026?')).toBe('crypto');
    expect(classifyCategory('Will ETH flip BTC? The Flippening')).toBe('crypto');
    expect(classifyCategory('Fed rate cut in June?')).toBe('crypto');
  });

  it('classifies Nigeria questions correctly', () => {
    expect(classifyCategory('Will Tinubu win the Lagos governorship?')).toBe('nigeria');
    expect(classifyCategory('Next CBN governor?')).toBe('nigeria');
    expect(classifyCategory('Naira exchange rate by December')).toBe('nigeria');
  });

  it('defaults to world for unclassified questions', () => {
    expect(classifyCategory('Will AGI be achieved by 2030?')).toBe('world');
    expect(classifyCategory('SpaceX Mars mission success?')).toBe('world');
  });
});
