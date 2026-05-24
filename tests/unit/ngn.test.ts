import { describe, expect, it } from 'vitest';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';

describe('usdcToNgn', () => {
  it('returns correct NGN amount', () => {
    expect(usdcToNgn(10, 1700)).toBe(17000);
    expect(usdcToNgn(0, 1700)).toBe(0);
    expect(usdcToNgn(1.5, 1700)).toBe(2550);
  });
});

describe('formatNgn', () => {
  it('formats with ₦ prefix and no decimals', () => {
    expect(formatNgn(0)).toBe('₦0');
    expect(formatNgn(17000)).toBe('₦17,000');
  });
});

describe('formatUsdc', () => {
  it('formats with $ prefix and 2 decimal places', () => {
    expect(formatUsdc(0)).toBe('$0.00');
    expect(formatUsdc(10)).toBe('$10.00');
    expect(formatUsdc(1.5)).toBe('$1.50');
    expect(formatUsdc(1234.56)).toBe('$1,234.56');
  });
});
