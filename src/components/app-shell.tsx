'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { getEmbeddedConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { ConnectButton } from './connect-button';
import { MarketSearch } from './market-search';
import { useCurrencyStore } from '@/lib/currency-store';
import { useWalletBalance } from '@/hooks/use-wallet-balance';
import { useFxRate } from '@/hooks/use-fx-rate';
import { formatNgn, formatUsdc, usdcToNgn } from '@/lib/ngn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const TABS = [
  { href: '/', label: 'Markets', match: (p: string) => p === '/' || p.startsWith('/markets') },
  { href: '/portfolio', label: 'Portfolio', match: (p: string) => p.startsWith('/portfolio') },
  { href: '/fund', label: 'Deposit', match: (p: string) => p.startsWith('/fund') },
  { href: '/withdraw', label: 'Withdraw', match: (p: string) => p.startsWith('/withdraw') },
  { href: '/partners', label: 'For partners', match: (p: string) => p.startsWith('/partners') },
];

function WaveLogo() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12 Q4 6 6 12 Q8 18 10 12 Q12 6 14 12 Q16 18 18 12 Q20 6 22 12" />
    </svg>
  );
}

function BalancePill() {
  const { wallets } = useWallets();
  const { data: fx } = useFxRate();
  const { displayCurrency } = useCurrencyStore();
  const embeddedWallet = getEmbeddedConnectedWallet(wallets);
  const address = embeddedWallet?.address as `0x${string}` | undefined;
  const { data: balance } = useWalletBalance(address);

  const usdc = balance ?? 0;
  const rate = fx?.rate ?? 1700;
  const label =
    displayCurrency === 'NGN' ? formatNgn(usdcToNgn(usdc, rate)) : formatUsdc(usdc);

  return (
    <span
      className="inline-flex h-8 items-center rounded-full border px-3 text-sm font-semibold tabular-nums"
      style={{ borderColor: 'var(--green-200)', background: 'var(--green-50)', color: 'var(--green-700)' }}
      title={`$${usdc.toFixed(2)} USDC`}
    >
      {label}
    </span>
  );
}

function AvatarDropdown() {
  const { user, logout } = usePrivy();
  const router = useRouter();
  const email = user?.email?.address ?? user?.google?.email ?? '';
  const initial = email.charAt(0).toUpperCase() || 'A';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ background: 'var(--green-600)' }}
        aria-label="Account menu"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {email && (
          <div className="px-2 py-1.5 text-xs" style={{ color: 'var(--gray-500)' }}>
            {email}
          </div>
        )}
        <DropdownMenuItem onClick={() => router.push('/account')}>Your account</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void logout()} style={{ color: 'var(--red-600)' }}>
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* App container */}
      <div
        className="mx-auto min-h-screen"
        style={{
          maxWidth: '1200px',
          background: '#fff',
          boxShadow: '0 0 40px rgba(0,0,0,0.05)',
        }}
      >
        {/* Partners strip */}
        <div
          className="px-7 py-2 text-xs"
          style={{ background: 'var(--gray-900)', color: 'rgba(255,255,255,0.85)' }}
        >
          <Link
            href="/partners"
            className="hover:underline"
            style={{ color: 'inherit' }}
          >
            For partners: see our integration approach and partnership ask →
          </Link>
        </div>

        {/* Sticky topbar */}
        <header
          className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b px-7"
          style={{ background: '#fff', borderColor: 'var(--gray-200)' }}
        >
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'var(--green-600)' }}
            >
              <WaveLogo />
            </div>
            <span className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--gray-900)' }}>
              predict<span style={{ color: 'var(--green-600)' }}>waves</span>
            </span>
          </Link>

          {/* Search trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex flex-1 max-w-sm items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:border-gray-300"
            style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-400)', background: 'var(--gray-50)' }}
            aria-label="Search markets"
          >
            <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1 text-left">Search markets…</span>
            <kbd
              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ background: 'var(--gray-100)', color: 'var(--gray-500)' }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Right: wallet actions */}
          <div className="flex shrink-0 items-center gap-2">
            {ready && authenticated && (
              <>
                <BalancePill />
                <Link
                  href="/fund"
                  className="hidden h-8 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:inline-flex"
                  style={{ background: 'var(--green-600)' }}
                >
                  <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Fund wallet
                </Link>
                <AvatarDropdown />
              </>
            )}
            {ready && !authenticated && <ConnectButton />}
          </div>
        </header>

        {/* Tab nav */}
        <nav
          className="sticky z-40 flex overflow-x-auto border-b px-4"
          style={{ top: '56px', background: '#fff', borderColor: 'var(--gray-200)', scrollbarWidth: 'none' }}
        >
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="shrink-0 whitespace-nowrap px-3 py-3.5 text-sm font-semibold transition-colors"
                style={{
                  color: active ? 'var(--green-600)' : 'var(--gray-500)',
                  borderBottom: active ? '2px solid var(--green-600)' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Page content */}
        <main>{children}</main>
      </div>

      {/* Search dialog (global, handles Cmd+K) */}
      <MarketSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
