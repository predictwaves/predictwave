import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserPositions } from '@/lib/polymarket-order';

const schema = z.object({
  address: z.string().startsWith('0x'),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  const parsed = schema.safeParse({ address });
  if (!parsed.success) {
    return NextResponse.json({ positions: [] });
  }
  try {
    const positions = await getUserPositions(parsed.data.address as `0x${string}`);
    return NextResponse.json({ positions });
  } catch {
    return NextResponse.json({ positions: [] });
  }
}
