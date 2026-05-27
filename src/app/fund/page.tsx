'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { useDepositWallet } from '@/hooks/use-deposit-wallet';

function truncateMiddle(s: string, start = 8, end = 6): string {
  if (s.length <= start + end) return s;
  return `${s.slice(0, start)}…${s.slice(-end)}`;
}

const ON_RAMPS = [
  { name: 'Fonbnk', description: 'Fund with airtime or mobile money', href: 'https://fonbnk.com' },
  { name: 'Bybit P2P', description: 'Fund with Naira via bank transfer', href: 'https://bybit.com' },
  { name: 'Luno', description: 'Fund with Naira via bank deposit', href: 'https://luno.com' },
];

// The Polymarket bridge maps the deposit wallet to a deposit address; USDC.e sent there
// is auto-converted to pUSD into the deposit wallet (the CLOB buying power).
function useBridgeDepositAddress(depositWallet: `0x${string}` | undefined) {
  return useQuery({
    queryKey: ['bridge-deposit-address', depositWallet],
    enabled: !!depositWallet,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch('/api/polymarket/deposit-address', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: depositWallet }),
      });
      if (!res.ok) throw new Error('Could not get a deposit address');
      return (await res.json()) as { evm: string };
    },
  });
}

export default function FundPage() {
  const depositWallet = useDepositWallet();
  const { data, isLoading, isError } = useBridgeDepositAddress(depositWallet);
  const depositAddress = data?.evm ?? '';

  async function handleCopy() {
    if (!depositAddress) return;
    await navigator.clipboard.writeText(depositAddress);
    toast.success('Deposit address copied');
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>Add money</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--gray-500)' }}>
          Send USDC.e on Polygon to your deposit address below. It auto-converts to pUSD
          and lands in your trading balance in about 60 seconds.
        </p>
      </div>

      {!depositWallet && (
        <div
          className="flex flex-col gap-2 rounded-2xl p-4"
          style={{ background: '#fff', border: '1px solid var(--gray-200)' }}
        >
          <p className="text-sm" style={{ color: 'var(--gray-700)' }}>
            Set up trading first to get your deposit address.
          </p>
          <Link href="/markets" className="text-sm font-semibold" style={{ color: 'var(--green-700)' }}>
            Go to markets →
          </Link>
        </div>
      )}

      {depositWallet && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-4"
          style={{ background: '#fff', border: '1px solid var(--gray-200)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}>
            Your deposit address
          </p>
          {isLoading && (
            <div className="h-5 w-48 animate-pulse rounded" style={{ background: 'var(--gray-100)' }} />
          )}
          {isError && (
            <p className="text-xs" style={{ color: 'var(--red-600)' }}>
              Couldn&apos;t load your deposit address. Please try again shortly.
            </p>
          )}
          {depositAddress && (
            <>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all font-mono text-xs" style={{ color: 'var(--gray-700)' }}>
                  {truncateMiddle(depositAddress, 20, 10)}
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
                Only send USDC.e on Polygon. Other chains or tokens will be lost.
              </p>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}>
          Fund with Naira
        </p>
        <p className="-mt-1 mb-1 text-xs" style={{ color: 'var(--gray-500)' }}>
          Buy through a trusted partner and your wallet gets credited automatically.
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
