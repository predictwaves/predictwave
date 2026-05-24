'use client';
import Link from 'next/link';
import { getEmbeddedConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCurrency } from '@/lib/currency-context';
import { formatNgn, usdcToNgn } from '@/lib/ngn';
import { useFxRate } from '@/hooks/use-fx-rate';
import { useWalletBalance } from '@/hooks/use-wallet-balance';
import { ConnectButton } from './connect-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

function BalancePill() {
  const { user, logout } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const embeddedWallet = getEmbeddedConnectedWallet(wallets);
  const address = embeddedWallet?.address as `0x${string}` | undefined;
  const { data: balance } = useWalletBalance(address);
  const { data: fx } = useFxRate();
  const { currency } = useCurrency();

  const usdc = balance ?? 0;
  const rate = fx?.rate ?? 1700;
  const label = currency === 'NGN' ? formatNgn(usdcToNgn(usdc, rate)) : `$${usdc.toFixed(2)}`;
  const email = user?.email?.address ?? user?.google?.email ?? '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-semibold transition-colors"
        style={{ borderColor: 'var(--green-200)', background: 'var(--green-50)', color: 'var(--green-700)' }}
        title={`$${usdc.toFixed(2)} USDC`}
      >
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {email && (
          <div className="px-2 py-1.5 text-xs" style={{ color: 'var(--gray-500)' }}>
            {email}
          </div>
        )}
        <DropdownMenuItem onClick={() => router.push('/account')}>
          Your account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void logout()} style={{ color: 'var(--red-600)' }}>
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const NAV_LINKS = [
  { href: '/markets', label: 'Markets' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/faq', label: 'FAQ' },
];

export function Topbar() {
  const { ready, authenticated } = usePrivy();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{ background: '#fff', borderColor: 'var(--gray-200)' }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: 'var(--green-600)' }}
          >
            P
          </div>
          <span className="text-base font-bold tracking-tight" style={{ color: 'var(--gray-900)' }}>
            predict<span style={{ color: 'var(--green-600)' }}>waves</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100"
              style={{ color: 'var(--gray-600)' }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {ready && authenticated && <BalancePill />}
          {ready && !authenticated && <ConnectButton />}

          {/* Mobile hamburger */}
          <button
            type="button"
            className="rounded-md p-1.5 md:hidden"
            style={{ color: 'var(--gray-600)' }}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          className="border-t px-4 py-2 md:hidden"
          style={{ borderColor: 'var(--gray-200)', background: '#fff' }}
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-md px-3 py-2 text-sm font-medium"
              style={{ color: 'var(--gray-700)' }}
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
