import { ClobClient, Chain, PriceHistoryInterval } from '@polymarket/clob-client';
import { serverEnv } from './env';

let _client: ClobClient | null = null;

function getClient(): ClobClient {
  if (_client) return _client;
  _client = new ClobClient(
    serverEnv.POLYMARKET_API_HOST,
    Chain.POLYGON,
    undefined,
    {
      key: serverEnv.POLYMARKET_API_KEY,
      secret: serverEnv.POLYMARKET_API_SECRET,
      passphrase: serverEnv.POLYMARKET_API_PASSPHRASE,
    },
  );
  return _client;
}

export interface MarketMeta {
  conditionId: string;
  question: string;
  description: string;
  category: string | null;
  endDate: string | null;
  volume24h: number;
  volumeTotal: number;
  liquidity: number;
  outcomes: { name: string; tokenId: string; price: number }[];
  active: boolean;
  closed: boolean;
}

export async function getMarket(conditionId: string): Promise<MarketMeta | null> {
  try {
    const c = getClient();
    const raw = await c.getMarket(conditionId);
    if (!raw) return null;
    return normalize(raw as Record<string, unknown>);
  } catch (e) {
    console.error('getMarket failed', conditionId, e);
    return null;
  }
}

export async function getTopMarketsByVolume(limit = 50): Promise<MarketMeta[]> {
  const c = getClient();
  const all: MarketMeta[] = [];
  let cursor: string | undefined;
  while (all.length < limit) {
    const page = await c.getMarkets(cursor);
    if (!page?.data?.length) break;
    for (const raw of page.data as Record<string, unknown>[]) {
      const m = normalize(raw);
      if (m.active && !m.closed) all.push(m);
    }
    cursor = page.next_cursor;
    if (!cursor || cursor === 'LTE=') break;
  }
  return all.sort((a, b) => b.volume24h - a.volume24h).slice(0, limit);
}

export async function getOrderbook(conditionId: string) {
  try {
    const c = getClient();
    const market = await getMarket(conditionId);
    if (!market) return null;
    const yesTokenId = market.outcomes[0]?.tokenId;
    if (!yesTokenId) return null;
    return c.getOrderBook(yesTokenId);
  } catch (e) {
    console.error('getOrderbook failed', conditionId, e);
    return null;
  }
}

export interface PricePoint { t: number; p: number }

export async function getPriceHistory(
  tokenId: string,
  interval: '1h' | '1d' | '1w' | 'all',
): Promise<PricePoint[]> {
  try {
    const c = getClient();
    const intervalMap: Record<string, PriceHistoryInterval> = {
      '1h': PriceHistoryInterval.ONE_HOUR,
      '1d': PriceHistoryInterval.ONE_DAY,
      '1w': PriceHistoryInterval.ONE_WEEK,
      all: PriceHistoryInterval.MAX,
    };
    const result = await c.getPricesHistory({
      market: tokenId,
      interval: intervalMap[interval] ?? PriceHistoryInterval.ONE_DAY,
    });
    // SDK may return either a raw array OR { history: [...] } — normalize to plain array.
    if (Array.isArray(result)) return result as PricePoint[];
    const wrapped = result as { history?: unknown };
    if (Array.isArray(wrapped?.history)) return wrapped.history as PricePoint[];
    return [];
  } catch (e) {
    console.error('getPriceHistory failed', tokenId, e);
    return [];
  }
}

export function classifyCategory(question: string): string {
  const q = question.toLowerCase();
  if (/(nigeria|lagos|abuja|naira|cbn|tinubu|inec|nlrc)/.test(q)) return 'nigeria';
  if (/(election|president|governor|senator|congress|parliament|vote|primary|2027|2028)/.test(q)) return 'politics';
  if (/(world cup|super bowl|nba|nfl|epl|premier league|champions league|afcon|bbnaija|olympic)/.test(q)) return 'sports';
  if (/(bitcoin|btc|ethereum|eth|crypto|sol|solana|defi|stablecoin|flippening|fed|rate cut)/.test(q)) return 'crypto';
  return 'world';
}

function normalize(raw: Record<string, unknown>): MarketMeta {
  const tokens = Array.isArray(raw.tokens) ? (raw.tokens as Record<string, unknown>[]) : [];
  const outcomes = tokens.map((t) => ({
    name: String(t.outcome ?? ''),
    tokenId: String(t.token_id ?? ''),
    price: Number(t.price ?? 0),
  }));
  const question = String(raw.question ?? raw.market_slug ?? 'Unknown');
  return {
    conditionId: String(raw.condition_id ?? ''),
    question,
    description: String(raw.description ?? ''),
    category: classifyCategory(question),
    endDate: raw.end_date_iso != null ? String(raw.end_date_iso) : null,
    volume24h: Number(raw.volume_24hr ?? 0),
    volumeTotal: Number(raw.volume_num ?? 0),
    liquidity: Number(raw.liquidity_num ?? 0),
    outcomes,
    active: Boolean(raw.active),
    closed: Boolean(raw.closed),
  };
}
