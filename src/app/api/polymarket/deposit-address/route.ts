import { NextResponse } from 'next/server';
import { z } from 'zod';
import { serverEnv } from '@/lib/env';

// Proxies Polymarket's Collateral Onramp ("bridge"): given the user's deposit wallet,
// it returns chain-specific deposit addresses. Funds sent to the returned EVM address
// are auto-converted to pUSD into the deposit wallet. Proxied server-side so we can
// attach the X-Builder-Code header and avoid browser CORS.
const schema = z.object({ address: z.string().startsWith('0x') });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (serverEnv.POLYMARKET_BUILDER_CODE) {
      headers['X-Builder-Code'] = serverEnv.POLYMARKET_BUILDER_CODE;
    }
    const res = await fetch('https://bridge.polymarket.com/deposit', {
      method: 'POST',
      headers,
      body: JSON.stringify({ address: parsed.data.address }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Bridge request failed' }, { status: 502 });
    }
    const data = (await res.json()) as { address?: { evm?: string } };
    const evm = data.address?.evm;
    if (!evm) {
      return NextResponse.json({ error: 'No EVM deposit address returned' }, { status: 502 });
    }
    return NextResponse.json({ evm });
  } catch {
    return NextResponse.json({ error: 'Bridge request failed' }, { status: 502 });
  }
}
