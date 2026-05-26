// Order placement runs through the unified @polymarket/client SDK server-side
// (see lib/polymarket-trading.ts + /api/trading/*). This module only exposes the
// read-only positions lookup used by /api/wallet/positions.

export interface UserPosition {
  conditionId: string;
  question: string;
  outcomeName: string;
  shares: number;
  averagePriceUsdc: number;
  currentPriceUsdc: number;
  valueUsdc: number;
  pnlUsdc: number;
}

// Positions come from Polymarket's Data API, keyed by the funder (the user's
// Polymarket trading wallet). Returns [] on any failure so the UI degrades gracefully.
export async function getUserPositions(address: `0x${string}`): Promise<UserPosition[]> {
  try {
    const url = `https://data-api.polymarket.com/positions?user=${address}&sizeThreshold=0.1`;
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) return [];
    const rows = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => {
      const shares = Number(r.size ?? 0);
      const avg = Number(r.avgPrice ?? 0);
      const cur = Number(r.curPrice ?? 0);
      const value = Number(r.currentValue ?? shares * cur);
      return {
        conditionId: String(r.conditionId ?? ''),
        question: String(r.title ?? r.question ?? ''),
        outcomeName: String(r.outcome ?? ''),
        shares,
        averagePriceUsdc: avg,
        currentPriceUsdc: cur,
        valueUsdc: value,
        pnlUsdc: Number(r.cashPnl ?? value - shares * avg),
      };
    });
  } catch {
    return [];
  }
}
