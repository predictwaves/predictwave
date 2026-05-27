import { decrypt, encrypt } from '@/lib/crypto';
import { createSupabaseAdmin } from '@/lib/supabase/server';

export interface ClobCreds {
  key: string;
  secret: string;
  passphrase: string;
}

export interface StoredUserCreds {
  creds: ClobCreds;
  // The user's Polymarket deposit wallet — the order maker, not the signing EOA.
  walletAddress: string;
}

export async function getStoredUserCreds(privyUserId: string): Promise<StoredUserCreds | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from('user_clob_creds')
    .select('*')
    .eq('privy_user_id', privyUserId)
    .maybeSingle();
  if (!data) return null;
  return {
    creds: {
      key: decrypt(data.encrypted_key as string),
      secret: decrypt(data.encrypted_secret as string),
      passphrase: decrypt(data.encrypted_passphrase as string),
    },
    walletAddress: data.wallet_address as string,
  };
}

export async function storeUserCreds(
  privyUserId: string,
  walletAddress: string,
  creds: ClobCreds,
): Promise<void> {
  const admin = createSupabaseAdmin();
  const { error } = await admin.from('user_clob_creds').upsert({
    privy_user_id: privyUserId,
    wallet_address: walletAddress,
    encrypted_key: encrypt(creds.key),
    encrypted_secret: encrypt(creds.secret),
    encrypted_passphrase: encrypt(creds.passphrase),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to store user creds: ${error.message}`);
}
