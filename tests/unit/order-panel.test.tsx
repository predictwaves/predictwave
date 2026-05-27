import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MarketMeta } from '@/lib/polymarket';

const state = {
  ready: true,
  authenticated: false,
  isReady: false,
  isCheckingStatus: false,
  isSettingUp: false,
};

vi.mock('@privy-io/react-auth', () => ({
  usePrivy: () => ({ ready: state.ready, authenticated: state.authenticated, login: vi.fn() }),
}));

vi.mock('@/hooks/use-trading-session', () => ({
  useTradingSession: () => ({
    isReady: state.isReady,
    isCheckingStatus: state.isCheckingStatus,
    identityTokenReady: true,
    runSetup: vi.fn(),
    isSettingUp: state.isSettingUp,
    setupPhase: state.isSettingUp ? 'setting-up' : 'idle',
    setupError: null,
  }),
}));

vi.mock('@/hooks/use-place-order', () => ({
  usePlaceOrder: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
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
  state.isReady = false;
  state.isCheckingStatus = false;
  state.isSettingUp = false;
});
afterEach(cleanup);

describe('OrderPanel button states', () => {
  it('prompts sign-in when unauthenticated', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /sign in to trade/i })).toBeInTheDocument();
  });

  it('prompts one-time setup when authenticated but session not ready', () => {
    state.authenticated = true;
    renderPanel();
    expect(screen.getByRole('button', { name: /set up trading/i })).toBeInTheDocument();
  });

  it('shows setup-in-progress label while setting up', () => {
    state.authenticated = true;
    state.isSettingUp = true;
    renderPanel();
    expect(screen.getByRole('button', { name: /setting up trading/i })).toBeInTheDocument();
  });

  it('shows "Enter an amount" when ready but no amount', () => {
    state.authenticated = true;
    state.isReady = true;
    renderPanel();
    expect(screen.getByRole('button', { name: /enter an amount/i })).toBeInTheDocument();
  });

  it('shows a buy CTA once ready and an amount is entered', () => {
    state.authenticated = true;
    state.isReady = true;
    renderPanel();
    fireEvent.change(screen.getByLabelText(/order amount/i), { target: { value: '20000' } });
    expect(screen.getByRole('button', { name: /buy yes at/i })).toBeInTheDocument();
  });

  it('renders both Buy YES and Buy NO tabs', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /^buy yes$/i, pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^buy no$/i })).toBeInTheDocument();
  });
});
