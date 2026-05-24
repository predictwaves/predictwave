// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Bypass persist middleware so tests run without localStorage (unit tests should not depend on storage)
vi.mock('zustand/middleware', () => ({
  persist: (fn: unknown) => fn,
  createJSONStorage: () => null,
}));

import { useCurrencyStore } from '@/lib/currency-store';

describe('useCurrencyStore', () => {
  beforeEach(() => {
    useCurrencyStore.setState({ displayCurrency: 'NGN', balanceVisible: true });
  });

  it('defaults to NGN', () => {
    expect(useCurrencyStore.getState().displayCurrency).toBe('NGN');
  });

  it('toggles to USD', () => {
    useCurrencyStore.getState().toggle();
    expect(useCurrencyStore.getState().displayCurrency).toBe('USD');
  });

  it('toggles back to NGN', () => {
    useCurrencyStore.getState().toggle();
    useCurrencyStore.getState().toggle();
    expect(useCurrencyStore.getState().displayCurrency).toBe('NGN');
  });

  it('defaults balanceVisible to true', () => {
    expect(useCurrencyStore.getState().balanceVisible).toBe(true);
  });

  it('toggles balanceVisible', () => {
    useCurrencyStore.getState().toggleBalanceVisible();
    expect(useCurrencyStore.getState().balanceVisible).toBe(false);
  });
});
