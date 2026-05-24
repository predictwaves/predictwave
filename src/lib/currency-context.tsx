'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Currency = 'NGN' | 'USD';

interface CurrencyContextValue {
  currency: Currency;
  toggle: () => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'NGN',
  toggle: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('NGN');

  useEffect(() => {
    const stored = localStorage.getItem('pw_currency');
    if (stored === 'NGN' || stored === 'USD') setCurrency(stored);
  }, []);

  const toggle = useCallback(() => {
    setCurrency((prev) => {
      const next: Currency = prev === 'NGN' ? 'USD' : 'NGN';
      localStorage.setItem('pw_currency', next);
      return next;
    });
  }, []);

  return <CurrencyContext.Provider value={{ currency, toggle }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
