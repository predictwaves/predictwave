import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prepareOrder } from '@/lib/polymarket-order';

const schema = z.object({
  conditionId: z.string(),
  tokenId: z.string(),
  side: z.enum(['BUY', 'SELL']),
  priceUsdc: z.number().gt(0).lt(1),
  sizeUsdc: z.number().gt(0),
  makerAddress: z.string().startsWith('0x'),
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
  try {
    const prepared = await prepareOrder({
      ...parsed.data,
      makerAddress: parsed.data.makerAddress as `0x${string}`,
    });
    return NextResponse.json(prepared);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: { code: 'PREPARE_FAILED', message } }, { status: 502 });
  }
}
