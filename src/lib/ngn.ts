export function usdcToNgn(usdc: number, rateNgnPerUsd: number): number {
  return usdc * rateNgnPerUsd;
}

export function ngnToUsdc(ngn: number, rateNgnPerUsd: number): number {
  if (rateNgnPerUsd <= 0) return 0;
  return ngn / rateNgnPerUsd;
}

export function formatNgn(value: number): string {
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export function formatUsdc(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
