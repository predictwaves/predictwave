'use client';
import { usePrivy } from '@privy-io/react-auth';
import { useSyncExternalStore } from 'react';
import { loadSetup } from '@/lib/polymarket-trading-client';

// Reads the user's Polymarket deposit wallet from the locally cached trading setup
// (written by useTradingSession after setup). Returns undefined until setup has run in
// this browser. Re-renders on cross-tab localStorage changes.
function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function useDepositWallet(): `0x${string}` | undefined {
  const { user } = usePrivy();
  const address = user?.wallet?.address;
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (address ? (loadSetup(address)?.depositWallet ?? null) : null),
    () => null,
  );
  return snapshot ?? undefined;
}
