import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { serverEnv } from './env';

// AES-256-GCM. Key is 32 bytes, hex-encoded in CLOB_CREDS_ENCRYPTION_KEY.
// Encrypted format: `${ivHex}:${authTagHex}:${ciphertextHex}`.
const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;

function getKey(): Buffer {
  return Buffer.from(serverEnv.CLOB_CREDS_ENCRYPTION_KEY, 'hex');
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, tagHex, ciphertextHex] = encrypted.split(':');
  if (!ivHex || !tagHex || !ciphertextHex) {
    throw new Error('Malformed ciphertext');
  }
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
