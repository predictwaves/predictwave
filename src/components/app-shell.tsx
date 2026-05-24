'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getEmbeddedConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { CurrencyToggle } from './currency-toggle';
import { ConnectButton } from './connect-button';
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

const NAV_ITEMS = [
  {
    href: '/markets',
    label: 'Markets',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 13h2l2-8 4 16 3-8 2 4h5" />
      </svg>
    ),
  },
  {
    href: '/how-it-works',
    label: 'How it works',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-7v-4m0-4h.01" />
      </svg>
    ),
  },
  {
    href: '/faq',
    label: 'FAQ',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const BOTTOM_TABS = [
  {
    href: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg aria-hidden="true" className="h-6 w-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/markets',
    label: 'Markets',
    icon: (active: boolean) => (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 1.75}
          d="M3 13h2l2-8 4 16 3-8 2 4h5" />
      </svg>
    ),
  },
  {
    href: '/account',
    label: 'Account',
    icon: (active: boolean) => (
      <svg aria-hidden="true" className="h-6 w-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

function BalancePill() {
  const { user, logout } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const embeddedWallet = getEmbeddedConnectedWallet(wallets);
  const address = embeddedWallet?.address as `0x${string}` | undefined;
  const { data: balance } = useWalletBalance(address);
  const { data: fx } = useFxRate();
  const { displayCurrency } = useCurrencyStore();

  const usdc = balance ?? 0;
  const rate = fx?.rate ?? 1700;
  const label = displayCurrency === 'NGN' ? formatNgn(usdcToNgn(usdc, rate)) : formatUsdc(usdc);
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:fixed md:inset-y-0 md:left-0 md:z-40"
        style={{ background: '#fff', boxShadow: '1px 0 0 var(--gray-200)' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-5 py-4 shrink-0">
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

        <div className="h-px shrink-0" style={{ background: 'var(--gray-200)' }} />

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          <p
            className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}
          >
            Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={
                  active
                    ? { background: 'var(--green-50)', color: 'var(--green-700)' }
                    : { color: 'var(--gray-600)' }
                }
              >
                <span style={{ color: active ? 'var(--green-600)' : 'var(--gray-400)' }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="h-px shrink-0" style={{ background: 'var(--gray-200)' }} />

        {/* Bottom of sidebar */}
        <div className="px-4 py-4 flex flex-col gap-3">
          <CurrencyToggle />
          {ready && !authenticated && <ConnectButton />}
          {ready && authenticated && <BalancePill />}
        </div>
      </aside>

      {/* ── Mobile top app bar ── */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between px-4 border-b"
        style={{ background: '#fff', borderColor: 'var(--gray-200)' }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: 'var(--green-600)' }}
          >
            P
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--gray-900)' }}>
            predict<span style={{ color: 'var(--green-600)' }}>waves</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <CurrencyToggle />
          {ready && authenticated && <BalancePill />}
          {ready && !authenticated && <ConnectButton />}
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 md:ml-60 pb-16 md:pb-0 mt-14 md:mt-0">
        {children}
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex h-16 border-t"
        style={{
          background: '#fff',
          borderColor: 'var(--gray-200)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {BOTTOM_TABS.map((tab) => {
          const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors"
              style={{ color: active ? 'var(--green-600)' : 'var(--gray-400)' }}
            >
              {tab.icon(active)}
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
