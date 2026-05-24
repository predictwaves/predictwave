import { beforeEach, describe, expect, it } from 'vitest';
import { useCurrencyStore } from '@/lib/currency-store';

describe('useCurrencyStore', () => {
  beforeEach(() => {
    localStorage.clear();
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
