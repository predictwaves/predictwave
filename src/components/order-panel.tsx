'use client';
import { getEmbeddedConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useApproveUsdc } from '@/hooks/use-approve-usdc';
import { type OrderPhase, usePlaceOrder } from '@/hooks/use-place-order';
import { useUsdcAllowance } from '@/hooks/use-usdc-allowance';
import { useWalletBalance } from '@/hooks/use-wallet-balance';
import { useCurrencyStore } from '@/lib/currency-store';
import { formatNgn, formatUsdc, ngnToUsdc, usdcToNgn } from '@/lib/ngn';
import type { MarketMeta } from '@/lib/polymarket';

type OutcomeTab = 'YES' | 'NO';
const QUICK_NGN = [5_000, 20_000, 100_000];

interface OrderPanelProps {
  market: MarketMeta;
  fxRate: number;
}

export function OrderPanel({ market, fxRate }: OrderPanelProps) {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const embedded = getEmbeddedConnectedWallet(wallets);
  const address = embedded?.address as `0x${string}` | undefined;

  const { data: balance } = useWalletBalance(address);
  const { data: allowance } = useUsdcAllowance(address);
  const placeOrder = usePlaceOrder();
  const approve = useApproveUsdc();

  const { displayCurrency: currency, toggle } = useCurrencyStore();

  const [tab, setTab] = useState<OutcomeTab>('YES');
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<OrderPhase | null>(null);

  const yesOutcome = market.outcomes[0];
  const noOutcome = market.outcomes[1];
  const outcome = tab === 'YES' ? yesOutcome : noOutcome;
  const priceUsdc = outcome?.price ?? 0;
  const tokenId = outcome?.tokenId ?? '';

  const usdcBalance = balance ?? 0;
  // Amount is entered in the active display currency; orders settle in USDC.
  const amountNum = Number.parseFloat(amount) || 0;
  const sizeUsdc = currency === 'NGN' ? ngnToUsdc(amountNum, fxRate) : amountNum;

  const expectedShares = priceUsdc > 0 ? sizeUsdc / priceUsdc : 0;
  const maxPayoutUsdc = expectedShares; // each share pays $1 if right
  const feeUsdc = sizeUsdc * 0.001; // 10 bps placeholder

  const fmt = (usdc: number) =>
    currency === 'NGN' ? formatNgn(usdcToNgn(usdc, fxRate)) : formatUsdc(usdc);

  const hasBalance = usdcBalance > 0;
  const approved = (allowance ?? 0n) > 0n;
  const insufficient = sizeUsdc > usdcBalance;

  const isBusy = placeOrder.isPending || approve.isPending;

  const accent = tab === 'YES' ? 'var(--green-600)' : 'var(--red-600)';
  const accentBg = tab === 'YES' ? 'var(--green-50)' : 'var(--red-50)';

  function setMaxAmount() {
    setAmount(
      currency === 'NGN'
        ? Math.floor(usdcToNgn(usdcBalance, fxRate)).toString()
        : usdcBalance.toFixed(2),
    );
  }

  function handleBuy() {
    if (!tokenId || sizeUsdc <= 0) return;
    placeOrder.mutate(
      {
        conditionId: market.conditionId,
        tokenId,
        side: 'BUY',
        priceUsdc,
        sizeUsdc,
        onPhase: setPhase,
      },
      {
        onSuccess: (res: { expectedShares: number }) => {
          toast.success(`Order placed — ${res.expectedShares} shares`);
          setAmount('');
          setPhase(null);
        },
        onSettled: () => setPhase(null),
      },
    );
  }

  const submit: { label: string; disabled: boolean; onClick: () => void; href?: string } = (() => {
    if (!ready) return { label: 'Loading…', disabled: true, onClick: () => {} };
    if (!authenticated) return { label: 'Sign in to trade', disabled: false, onClick: login };
    if (!hasBalance)
      return { label: 'Fund your wallet', disabled: false, onClick: () => {}, href: '/fund' };
    if (!approved)
      return {
        label: approve.isPending ? 'Approving…' : 'Approve USDC (one-time)',
        disabled: approve.isPending,
        onClick: () => approve.mutate(),
      };
    if (placeOrder.isPending) {
      const label =
        phase === 'authorizing'
          ? 'First-time setup…'
          : phase === 'submitting'
            ? 'Submitting…'
            : 'Signing…';
      return { label, disabled: true, onClick: () => {} };
    }
    if (sizeUsdc <= 0) return { label: 'Enter an amount', disabled: true, onClick: () => {} };
    if (insufficient) return { label: 'Insufficient balance', disabled: true, onClick: () => {} };
    return { label: `Buy ${tab} at ${fmt(priceUsdc)}`, disabled: false, onClick: handleBuy };
  })();

  return (
    <div
      className="w-full rounded-xl border lg:sticky lg:top-20"
      style={{ background: '#fff', borderColor: 'var(--gray-200)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 p-2">
        {(['YES', 'NO'] as OutcomeTab[]).map((t) => {
          const active = tab === t;
          const tColor = t === 'YES' ? 'var(--green-600)' : 'var(--red-600)';
          const tBg = t === 'YES' ? 'var(--green-50)' : 'var(--red-50)';
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="rounded-lg py-2.5 text-sm font-bold transition-colors"
              style={
                active
                  ? { background: tBg, color: tColor, border: `1px solid ${tColor}` }
                  : { background: 'var(--gray-50)', color: 'var(--gray-500)', border: '1px solid transparent' }
              }
              aria-pressed={active}
            >
              Buy {t}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4">
        {/* Amount input + currency toggle */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--gray-500)' }}>
              Amount
            </span>
            <button
              type="button"
              onClick={toggle}
              className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
              style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-500)' }}
            >
              {currency === 'NGN' ? '₦ NGN' : '$ USD'}
            </button>
          </div>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder={currency === 'NGN' ? '0' : '0.00'}
            aria-label="Order amount"
            className="w-full rounded-lg border px-3 py-2.5 text-lg font-semibold tabular-nums outline-none"
            style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-900)' }}
          />
          <div className="flex flex-wrap gap-2">
            {QUICK_NGN.map((ngn) => (
              <button
                key={ngn}
                type="button"
                onClick={() =>
                  setAmount(
                    currency === 'NGN' ? ngn.toString() : ngnToUsdc(ngn, fxRate).toFixed(2),
                  )
                }
                className="rounded-full border px-3 py-1 text-xs font-medium"
                style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-600)' }}
              >
                {currency === 'NGN' ? formatNgn(ngn) : formatUsdc(ngnToUsdc(ngn, fxRate))}
              </button>
            ))}
            <button
              type="button"
              onClick={setMaxAmount}
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-600)' }}
            >
              Max
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-1.5 rounded-lg p-3 text-xs" style={{ background: accentBg }}>
          <PreviewRow label="Shares" value={expectedShares.toFixed(2)} />
          <PreviewRow label="Avg price" value={`${fmt(priceUsdc)} / share`} />
          <PreviewRow label="Max payout if right" value={fmt(maxPayoutUsdc)} color={accent} />
          <PreviewRow label="Fee (0.1%)" value={fmt(feeUsdc)} />
        </div>

        {/* Submit */}
        {submit.href ? (
          <Link
            href={submit.href}
            className="flex w-full items-center justify-center rounded-lg py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: accent }}
          >
            {submit.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={submit.onClick}
            disabled={submit.disabled || isBusy}
            className="w-full rounded-lg py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: accent }}
          >
            {submit.label}
          </button>
        )}

        {placeOrder.isPending && phase === 'authorizing' && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--gray-600)' }}>
            First trade requires a one-time wallet authorization. You'll see a sign request —
            approve to continue.
          </p>
        )}
        {placeOrder.isError && (
          <p className="text-xs font-medium" style={{ color: 'var(--red-600)' }}>
            {placeOrder.error instanceof Error ? placeOrder.error.message : 'Order failed'}
          </p>
        )}
        {approve.isError && (
          <p className="text-xs font-medium" style={{ color: 'var(--red-600)' }}>
            {approve.error instanceof Error ? approve.error.message : 'Approval failed'}
          </p>
        )}

        <p className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--gray-400)' }}>
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Powered by Polymarket • Settles in USDC on Polygon
        </p>
      </div>
    </div>
  );
}

function PreviewRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--gray-500)' }}>{label}</span>
      <span className="font-semibold tabular-nums" style={{ color: color ?? 'var(--gray-800)' }}>
        {value}
      </span>
    </div>
  );
}
