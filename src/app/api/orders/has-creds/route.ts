import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStoredUserCreds } from '@/lib/polymarket-user-creds';
import { getPrivyServerClient } from '@/lib/privy-server';

const schema = z.object({ privyAccessToken: z.string() });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ hasCreds: false });

  try {
    const verified = await getPrivyServerClient().verifyAuthToken(parsed.data.privyAccessToken);
    const creds = await getStoredUserCreds(verified.userId);
    return NextResponse.json({ hasCreds: !!creds });
  } catch {
    return NextResponse.json({ hasCreds: false });
  }
}
