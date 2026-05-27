// Order placement runs client-side (see lib/polymarket-trading-client.ts). This module
// only exposes the read-only positions lookup used by /api/wallet/positions.

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

export interface UserActivity {
  type: string; // TRADE, REDEEM, SPLIT, MERGE, …
  side: string | null; // BUY / SELL for trades
  question: string;
  outcomeName: string;
  shares: number;
  priceUsdc: number;
  valueUsdc: number;
  timestamp: number; // unix seconds
  conditionId: string;
  txHash: string | null;
}

// Trade/settlement history from Polymarket's Data API, keyed by the deposit wallet.
// Returns [] on any failure so the UI degrades gracefully.
export async function getUserActivity(address: `0x${string}`): Promise<UserActivity[]> {
  try {
    const url = `https://data-api.polymarket.com/activity?user=${address}&limit=50`;
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) return [];
    const rows = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => ({
      type: String(r.type ?? 'TRADE'),
      side: r.side != null ? String(r.side) : null,
      question: String(r.title ?? r.question ?? ''),
      outcomeName: String(r.outcome ?? ''),
      shares: Number(r.size ?? 0),
      priceUsdc: Number(r.price ?? 0),
      valueUsdc: Number(r.usdcSize ?? 0),
      timestamp: Number(r.timestamp ?? 0),
      conditionId: String(r.conditionId ?? ''),
      txHash: r.transactionHash != null ? String(r.transactionHash) : null,
    }));
  } catch {
    return [];
  }
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
