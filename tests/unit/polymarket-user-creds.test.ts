import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory stand-in for the user_clob_creds table.
const table = new Map<string, Record<string, unknown>>();

vi.mock('@/lib/crypto', () => ({
  encrypt: (s: string) => `enc(${s})`,
  decrypt: (s: string) => s.replace(/^enc\(/, '').replace(/\)$/, ''),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdmin: () => ({
    from: () => ({
      upsert: async (row: Record<string, unknown>) => {
        table.set(row.privy_user_id as string, row);
        return { error: null };
      },
      select: () => ({
        eq: (_col: string, id: string) => ({
          maybeSingle: async () => ({ data: table.get(id) ?? null }),
        }),
      }),
    }),
  }),
}));

import { getStoredUserCreds, storeUserCreds } from '@/lib/polymarket-user-creds';

beforeEach(() => table.clear());

describe('polymarket-user-creds', () => {
  it('stores creds encrypted and retrieves them decrypted', async () => {
    await storeUserCreds('did:privy:abc', '0xWALLET', {
      key: 'K',
      secret: 'S',
      passphrase: 'P',
    });

    const row = table.get('did:privy:abc');
    expect(row?.encrypted_key).toBe('enc(K)');
    expect(row?.encrypted_secret).toBe('enc(S)');
    expect(row?.encrypted_passphrase).toBe('enc(P)');
    expect(row?.wallet_address).toBe('0xWALLET');

    const got = await getStoredUserCreds('did:privy:abc');
    expect(got).toEqual({
      creds: { key: 'K', secret: 'S', passphrase: 'P' },
      walletAddress: '0xWALLET',
    });
  });

  it('returns null when no creds stored', async () => {
    expect(await getStoredUserCreds('did:privy:missing')).toBeNull();
  });
});
