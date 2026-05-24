import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  clientEnv: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
  serverEnv: {
    FX_SOURCE_URL: 'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=ngn',
    FX_CACHE_TTL_SECONDS: 300,
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getCachedRate } from '@/lib/fx';

const mockSupabase = {
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createSupabaseAdmin).mockReturnValue(
    mockSupabase as unknown as ReturnType<typeof createSupabaseAdmin>,
  );
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.upsert.mockResolvedValue({ error: null });
});

describe('getCachedRate', () => {
  it('returns shape { pair, rate, fetchedAt, source, stale } from cache', async () => {
    mockSupabase.maybeSingle.mockResolvedValue({
      data: {
        pair: 'NGN/USD',
        rate: '1725.5',
        source: 'coingecko-tether-ngn',
        fetched_at: new Date().toISOString(),
      },
    });

    const result = await getCachedRate('NGN/USD');

    expect(result).toMatchObject({
      pair: 'NGN/USD',
      rate: 1725.5,
      source: 'coingecko-tether-ngn',
      stale: false,
    });
    expect(typeof result.fetchedAt).toBe('string');
    expect(typeof result.rate).toBe('number');
  });

  it('marks rate as stale when cache is older than TTL', async () => {
    const oldDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    mockSupabase.maybeSingle.mockResolvedValue({
      data: {
        pair: 'NGN/USD',
        rate: '1700',
        source: 'coingecko-tether-ngn',
        fetched_at: oldDate,
      },
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tether: { ngn: 1750 } }),
    }));

    const result = await getCachedRate('NGN/USD');

    expect(result.stale).toBe(true);
    expect(result.rate).toBe(1700);
  });

  it('does a blocking fetch when no cache exists', async () => {
    mockSupabase.maybeSingle.mockResolvedValue({ data: null });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tether: { ngn: 1800.25 } }),
    }));

    const result = await getCachedRate('NGN/USD');

    expect(result.rate).toBe(1800.25);
    expect(result.stale).toBe(false);
    expect(result.source).toBe('coingecko-tether-ngn');
    expect(mockSupabase.upsert).toHaveBeenCalled();
  });
});
