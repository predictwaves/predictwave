import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { EIP712TypedData } from '@polymarket/clob-client';
import { submitSignedOrder } from '@/lib/polymarket-order';
import { getStoredUserCreds } from '@/lib/polymarket-user-creds';
import { getPrivyServerClient } from '@/lib/privy-server';

const schema = z.object({
  typedData: z.unknown(),
  signature: z.string().startsWith('0x'),
  orderHash: z.string().startsWith('0x'),
  conditionId: z.string(),
  privyAccessToken: z.string(),
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

  // Verify the caller and load their own CLOB creds — orders authenticate as the maker.
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

  const userCreds = await getStoredUserCreds(privyUserId);
  if (!userCreds) {
    return NextResponse.json(
      { error: { code: 'NO_CREDS', message: 'Sign in to enable trading' } },
      { status: 401 },
    );
  }

  try {
    const result = await submitSignedOrder({
      typedData: parsed.data.typedData as EIP712TypedData,
      signature: parsed.data.signature as `0x${string}`,
      orderHash: parsed.data.orderHash as `0x${string}`,
      conditionId: parsed.data.conditionId,
      userCreds,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: { code: 'SUBMIT_FAILED', message } }, { status: 502 });
  }
}
