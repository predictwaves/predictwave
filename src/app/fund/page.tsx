'use client';
import { getEmbeddedConnectedWallet, useWallets } from '@privy-io/react-auth';
import { toast } from 'sonner';

function truncateMiddle(s: string, start = 8, end = 6): string {
  if (s.length <= start + end) return s;
  return `${s.slice(0, start)}…${s.slice(-end)}`;
}

const ON_RAMPS = [
  { name: 'Yellow Card', description: 'Buy USDC with Naira via bank transfer', href: 'https://yellowcard.io' },
  { name: 'Fonbnk', description: 'Convert airtime or mobile money to USDC', href: 'https://fonbnk.com' },
  { name: 'Bybit P2P', description: 'Buy USDC from verified Nigerian merchants', href: 'https://bybit.com' },
  { name: 'Luno', description: 'Buy crypto with Naira and bridge to Polygon', href: 'https://luno.com' },
];

export default function FundPage() {
  const { wallets } = useWallets();
  const embeddedWallet = getEmbeddedConnectedWallet(wallets);
  const address = embeddedWallet?.address ?? '';

  async function handleCopy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    toast.success('Address copied');
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>Add money</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--gray-500)' }}>
          Send USDC (Polygon) to your wallet address below.
        </p>
      </div>

      {address && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-4"
          style={{ background: '#fff', border: '1px solid var(--gray-200)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}>
            Your Polygon address
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all font-mono text-xs" style={{ color: 'var(--gray-700)' }}>
              {truncateMiddle(address, 20, 10)}
            </code>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'var(--green-50)', color: 'var(--green-700)' }}
            >
              Copy
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
            Only send USDC on Polygon. Other chains or tokens will be lost.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}>
          Buy USDC in Nigeria
        </p>
        {ON_RAMPS.map((ramp) => (
          <a
            key={ramp.name}
            href={ramp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-gray-50"
            style={{ background: '#fff', border: '1px solid var(--gray-200)' }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--gray-900)' }}>{ramp.name}</p>
              <p className="text-xs" style={{ color: 'var(--gray-500)' }}>{ramp.description}</p>
            </div>
            <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--gray-300)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>
    </main>
  );
}
