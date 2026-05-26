import { NextResponse } from 'next/server';
import { z } from 'zod';
import { storeUserCreds } from '@/lib/polymarket-user-creds';
import { getPrivyServerClient } from '@/lib/privy-server';
import { resolveEmbeddedWallet, setupTrading } from '@/lib/polymarket-trading';

const schema = z.object({ privyAccessToken: z.string(), privyIdentityToken: z.string() });

// One-time (idempotent) trading setup: ensures the user's gasless wallet + approvals
// exist via Privy delegated signing, then persists the CLOB credentials.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'BAD_INPUT', message: parsed.error.message } },
      { status: 400 },
    );
  }

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
    const embedded = await resolveEmbeddedWallet(parsed.data.privyIdentityToken);
    if (!embedded) {
      return NextResponse.json(
        { error: { code: 'NO_WALLET', message: 'No embedded wallet found' } },
        { status: 400 },
      );
    }
    const { creds, walletAddress } = await setupTrading(embedded);
    await storeUserCreds(privyUserId, walletAddress, creds);
    return NextResponse.json({ ready: true, walletAddress });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: { code: 'SETUP_FAILED', message } }, { status: 502 });
  }
}
