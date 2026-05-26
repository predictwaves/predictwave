import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deriveUserClobCreds } from '@/lib/polymarket-order';
import { storeUserCreds } from '@/lib/polymarket-user-creds';
import { getPrivyServerClient } from '@/lib/privy-server';

const schema = z.object({
  privyAccessToken: z.string(),
  walletAddress: z.string().startsWith('0x'),
  nonce: z.number(),
  timestamp: z.number(),
  signature: z.string().startsWith('0x'),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'BAD_INPUT', message: parsed.error.message } },
      { status: 400 },
    );
  }

  // Verify the Privy token to confirm the caller owns this account.
  let privyUserId: string;
  try {
    const verified = await getPrivyServerClient().verifyAuthToken(parsed.data.privyAccessToken);
    privyUserId = verified.userId;
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid Privy token' } },
      { status: 401 },
    );
  }

  try {
    const creds = await deriveUserClobCreds({
      walletAddress: parsed.data.walletAddress as `0x${string}`,
      signature: parsed.data.signature as `0x${string}`,
      nonce: parsed.data.nonce,
      timestamp: parsed.data.timestamp,
    });
    await storeUserCreds(privyUserId, parsed.data.walletAddress, creds);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: { code: 'DERIVE_FAILED', message } }, { status: 502 });
  }
}
