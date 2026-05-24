'use client';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { ConnectButton } from '@/components/connect-button';

export default function HomePage() {
  const { authenticated } = usePrivy();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-6 text-center px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: 'var(--green-600)' }}
          >
            P
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--gray-900)' }}>
            predict<span style={{ color: 'var(--green-600)' }}>waves</span>
          </span>
        </div>

        <p className="text-lg font-medium" style={{ color: 'var(--gray-700)' }}>
          Polymarket markets in Naira.
        </p>

        <ConnectButton />

        {authenticated && (
          <Link
            href="/account"
            className="text-sm font-medium"
            style={{ color: 'var(--green-600)' }}
          >
            Go to your account →
          </Link>
        )}
      </div>
    </main>
  );
}
