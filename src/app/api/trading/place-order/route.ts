import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStoredUserCreds } from '@/lib/polymarket-user-creds';
import { getPrivyServerClient } from '@/lib/privy-server';
import { placeOrder, resolveEmbeddedWallet } from '@/lib/polymarket-trading';

// Pin to Dublin: Polymarket geoblocks US regions (Vercel's default iad1), so the
// CLOB/relayer calls in this route must run from a non-blocked EU region.
export const runtime = 'nodejs';
export const preferredRegion = 'dub1';
export const maxDuration = 30;

const schema = z.object({
  privyAccessToken: z.string().min(1),
  privyIdentityToken: z.string().min(1),
  tokenId: z.string(),
  side: z.enum(['BUY', 'SELL']),
  price: z.number().gt(0).lt(1),
  size: z.number().gt(0),
  conditionId: z.string(),
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

  const creds = await getStoredUserCreds(privyUserId);
  if (!creds) {
    return NextResponse.json(
      { error: { code: 'NO_CREDS', message: 'Run trading setup first' } },
      { status: 409 },
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
    const result = await placeOrder(embedded, creds, {
      tokenId: parsed.data.tokenId,
      side: parsed.data.side,
      price: parsed.data.price,
      size: parsed.data.size,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: { code: 'ORDER_REJECTED', message: 'Order was not accepted' } },
        { status: 502 },
      );
    }
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: { code: 'ORDER_FAILED', message } }, { status: 502 });
  }
}
