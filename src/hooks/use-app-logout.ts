'use client';
import { usePrivy } from '@privy-io/react-auth';
import { clearAllTradingSetups } from '@/lib/polymarket-trading-client';

// Logs out and clears locally cached CLOB credentials so they don't leak to the next
// user on a shared device. Use this everywhere instead of Privy's logout directly.
export function useAppLogout(): () => Promise<void> {
  const { logout } = usePrivy();
  return async () => {
    clearAllTradingSetups();
    await logout();
  };
}
