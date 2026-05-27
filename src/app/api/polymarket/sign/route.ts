import { buildHmacSignature } from '@polymarket/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { serverEnv } from '@/lib/env';
import { getPrivyServerClient } from '@/lib/privy-server';

// Remote builder-signing endpoint for the client SDK's remoteBuilderSigning(). The
// builder secret never leaves the server: the browser POSTs the request to sign and
// gets back the HMAC + public builder fields. Contract matches @polymarket/client.
const schema = z.object({
  method: z.string(),
  path: z.string(),
  body: z.string().optional(),
});

export async function POST(request: Request) {
  // Require an authenticated Privy user. Without this, the endpoint is an open oracle
  // that signs builder-authenticated requests with our credentials for anyone.
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await getPrivyServerClient().verifyAuthToken(token);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const { key, secret, passphrase } = {
    key: serverEnv.POLYMARKET_BUILDER_API_KEY,
    secret: serverEnv.POLYMARKET_BUILDER_SECRET,
    passphrase: serverEnv.POLYMARKET_BUILDER_PASSPHRASE,
  };

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await buildHmacSignature(
    secret,
    timestamp,
    parsed.data.method,
    parsed.data.path,
    parsed.data.body,
  );

  return NextResponse.json({
    POLY_BUILDER_API_KEY: key,
    POLY_BUILDER_PASSPHRASE: passphrase,
    POLY_BUILDER_SIGNATURE: signature,
    POLY_BUILDER_TIMESTAMP: `${timestamp}`,
  });
}
