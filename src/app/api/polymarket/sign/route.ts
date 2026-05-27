import { buildHmacSignature } from '@polymarket/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { serverEnv } from '@/lib/env';

// Remote builder-signing endpoint for the client SDK's remoteBuilderSigning(). The
// builder secret never leaves the server: the browser POSTs the request to sign and
// gets back the HMAC + public builder fields. Contract matches @polymarket/client.
const schema = z.object({
  method: z.string(),
  path: z.string(),
  body: z.string().optional(),
});

export async function POST(request: Request) {
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
