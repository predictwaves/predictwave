import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MarketMeta } from '@/lib/polymarket';

// --- Mutable mock state, reset per test ---
const state = {
  ready: true,
  authenticated: false,
  address: undefined as string | undefined,
  balance: 0,
  allowance: 0n,
};

vi.mock('@privy-io/react-auth', () => ({
  usePrivy: () => ({ ready: state.ready, authenticated: state.authenticated, login: vi.fn() }),
  useWallets: () => ({ wallets: [] }),
  getEmbeddedConnectedWallet: () =>
    state.address ? { address: state.address, getEthereumProvider: vi.fn() } : undefined,
}));

vi.mock('@/hooks/use-wallet-balance', () => ({
  useWalletBalance: () => ({ data: state.balance, isLoading: false }),
}));
vi.mock('@/hooks/use-usdc-allowance', () => ({
  useUsdcAllowance: () => ({ data: state.allowance }),
}));
vi.mock('@/hooks/use-place-order', () => ({
  usePlaceOrder: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
}));
vi.mock('@/hooks/use-approve-usdc', () => ({
  useApproveUsdc: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { OrderPanel } from '@/components/order-panel';

const market: MarketMeta = {
  conditionId: '0xabc',
  question: 'Will it rain?',
  description: '',
  category: 'world',
  endDate: null,
  volume24h: 0,
  volumeTotal: 0,
  liquidity: 0,
  outcomes: [
    { name: 'Yes', tokenId: 'yes-token', price: 0.6 },
    { name: 'No', tokenId: 'no-token', price: 0.4 },
  ],
  active: true,
  closed: false,
};

function renderPanel() {
  return render(<OrderPanel market={market} fxRate={1700} />);
}

beforeEach(() => {
  state.ready = true;
  state.authenticated = false;
  state.address = undefined;
  state.balance = 0;
  state.allowance = 0n;
});
afterEach(cleanup);

describe('OrderPanel button states', () => {
  it('prompts sign-in when unauthenticated', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /sign in to trade/i })).toBeInTheDocument();
  });

  it('prompts funding when authenticated with zero balance', () => {
    state.authenticated = true;
    state.address = '0x1111111111111111111111111111111111111111';
    state.balance = 0;
    renderPanel();
    expect(screen.getByText(/fund your wallet/i)).toBeInTheDocument();
  });

  it('prompts one-time approval when funded but not approved', () => {
    state.authenticated = true;
    state.address = '0x1111111111111111111111111111111111111111';
    state.balance = 50;
    state.allowance = 0n;
    renderPanel();
    expect(screen.getByRole('button', { name: /approve usdc/i })).toBeInTheDocument();
  });

  it('shows "Enter an amount" when funded and approved but no amount typed', () => {
    state.authenticated = true;
    state.address = '0x1111111111111111111111111111111111111111';
    state.balance = 50;
    state.allowance = 2n ** 200n;
    renderPanel();
    expect(screen.getByRole('button', { name: /enter an amount/i })).toBeInTheDocument();
  });

  it('shows a buy CTA once an amount within balance is entered', () => {
    state.authenticated = true;
    state.address = '0x1111111111111111111111111111111111111111';
    state.balance = 50;
    state.allowance = 2n ** 200n;
    renderPanel();
    // 20,000 NGN at fx 1700 ≈ $11.76 USDC, under the $50 balance.
    fireEvent.change(screen.getByLabelText(/order amount/i), { target: { value: '20000' } });
    expect(screen.getByRole('button', { name: /buy yes at/i })).toBeInTheDocument();
  });

  it('renders both Buy YES and Buy NO tabs', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /^buy yes$/i, pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^buy no$/i })).toBeInTheDocument();
  });
});
