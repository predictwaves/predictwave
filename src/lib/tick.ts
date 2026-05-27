// Polymarket order books have a minimum tick size (typically 0.01, sometimes 0.001).
// The CLOB rejects any price that isn't an exact multiple of the tick, so round to it
// before submitting. Returns a value carrying the tick's decimal precision (0.01 → 2dp).
export function roundToTick(price: number, tickSize: number): number {
  if (!Number.isFinite(tickSize) || tickSize <= 0) return price;
  const decimals = Math.max(0, Math.round(-Math.log10(tickSize)));
  return Number((Math.round(price / tickSize) * tickSize).toFixed(decimals));
}
