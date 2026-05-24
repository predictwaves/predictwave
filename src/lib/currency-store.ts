'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Currency = 'NGN' | 'USD';

interface CurrencyStore {
  displayCurrency: Currency;
  balanceVisible: boolean;
  toggle: () => void;
  toggleBalanceVisible: () => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      displayCurrency: 'NGN',
      balanceVisible: true,
      toggle: () =>
        set({ displayCurrency: get().displayCurrency === 'NGN' ? 'USD' : 'NGN' }),
      toggleBalanceVisible: () =>
        set({ balanceVisible: !get().balanceVisible }),
    }),
    {
      name: 'pw_currency',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {},
            key: () => null,
            length: 0,
          } as unknown as Storage;
        }
        return localStorage;
      }),
    },
  ),
);
