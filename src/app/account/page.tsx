'use client';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConnectButton } from '@/components/connect-button';
import { useAppLogout } from '@/hooks/use-app-logout';
import { useDepositWallet } from '@/hooks/use-deposit-wallet';
import { useWalletBalance } from '@/hooks/use-wallet-balance';
import { formatUsdc } from '@/lib/ngn';

function truncateMiddle(s: string, start = 8, end = 6): string {
  if (s.length <= start + end) return s;
  return `${s.slice(0, start)}…${s.slice(-end)}`;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest"
      style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}
    >
      {children}
    </p>
  );
}

function SettingsRow({
  label,
  value,
  action,
  onAction,
  href,
  destructive,
}: {
  label: string;
  value?: string;
  action?: string;
  onAction?: () => void;
  href?: string;
  destructive?: boolean;
}) {
  const inner = (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3.5"
      style={{ background: '#fff', border: '1px solid var(--gray-200)' }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium" style={{ color: destructive ? 'var(--red-600)' : 'var(--gray-900)' }}>
          {label}
        </span>
        {value && (
          <span className="font-mono text-xs" style={{ color: 'var(--gray-400)' }}>
            {value}
          </span>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-semibold"
          style={{ color: destructive ? 'var(--red-600)' : 'var(--green-600)' }}
        >
          {action}
        </button>
      )}
      {href && !action && (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--gray-300)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

export default function AccountPage() {
  const { ready, authenticated, user } = usePrivy();
  const logout = useAppLogout();
  const depositWallet = useDepositWallet();
  const { data: pusd } = useWalletBalance(depositWallet);

  if (!ready) return null;

  if (!authenticated) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-base font-medium" style={{ color: 'var(--gray-700)' }}>
          Sign in to see your account
        </p>
        <ConnectButton />
      </main>
    );
  }

  const email = user?.email?.address ?? user?.google?.email ?? '';

  async function handleCopyAddress() {
    if (!depositWallet) return;
    await navigator.clipboard.writeText(depositWallet);
    toast.success('Address copied');
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>Account</h1>

      {/* Profile */}
      <div className="flex flex-col gap-2">
        <SectionHeader>Profile</SectionHeader>
        {email && <SettingsRow label="Email" value={email} />}
      </div>

      {/* Wallet */}
      <div className="flex flex-col gap-2">
        <SectionHeader>Wallet</SectionHeader>
        <SettingsRow label="Trading balance" value={formatUsdc(depositWallet ? (pusd ?? 0) : 0)} />
        {depositWallet ? (
          <SettingsRow
            label="Deposit wallet"
            value={truncateMiddle(depositWallet)}
            action="Copy"
            onAction={() => void handleCopyAddress()}
          />
        ) : (
          <SettingsRow label="Deposit wallet" value="Set up trading to create" />
        )}
        <SettingsRow label="Transaction history" href="/account/history" />
      </div>

      {/* Funding */}
      <div className="flex flex-col gap-2">
        <SectionHeader>Funding</SectionHeader>
        <SettingsRow label="Add money (USDC)" href="/fund" />
        <SettingsRow label="Withdraw" href="/withdraw" />
      </div>

      {/* Preferences */}
      <div className="flex flex-col gap-2">
        <SectionHeader>Preferences</SectionHeader>
        <SettingsRow label="Markets" href="/markets" />
      </div>

      {/* Danger zone */}
      <div className="flex flex-col gap-2">
        <SectionHeader>Account</SectionHeader>
        <SettingsRow
          label="Disconnect wallet"
          action="Disconnect"
          onAction={() => void logout()}
          destructive
        />
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--gray-400)' }}>
        Powered by Polygon · Stablecoin: pUSD
      </p>
    </main>
  );
}
