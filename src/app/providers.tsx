'use client';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { CurrencyProvider } from '@/lib/currency-context';
import { env } from '@/lib/env';
import { privyConfig } from '@/lib/privy';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <PrivyProvider appId={env.NEXT_PUBLIC_PRIVY_APP_ID} config={privyConfig}>
      <QueryClientProvider client={client}>
        <CurrencyProvider>{children}</CurrencyProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
