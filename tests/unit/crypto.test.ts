import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  serverEnv: { CLOB_CREDS_ENCRYPTION_KEY: 'a'.repeat(64) },
}));

import { decrypt, encrypt } from '@/lib/crypto';

describe('crypto (AES-256-GCM)', () => {
  it('round-trips plaintext', () => {
    const pt = 'clob-secret-passphrase-value';
    const enc = encrypt(pt);
    expect(enc).not.toContain(pt);
    expect(enc.split(':')).toHaveLength(3);
    expect(decrypt(enc)).toBe(pt);
  });

  it('uses a random IV so ciphertexts differ', () => {
    expect(encrypt('same')).not.toBe(encrypt('same'));
  });

  it('throws on tampered ciphertext (auth tag mismatch)', () => {
    const [iv, tag, ct] = encrypt('hello world').split(':') as [string, string, string];
    const tampered = `${iv}:${tag}:${ct.slice(0, -2)}00`;
    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws on malformed input', () => {
    expect(() => decrypt('not-valid')).toThrow('Malformed ciphertext');
  });
});
