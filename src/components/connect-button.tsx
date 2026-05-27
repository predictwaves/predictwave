'use client';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppLogout } from '@/hooks/use-app-logout';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectButton() {
  const { ready, authenticated, user, login } = usePrivy();
  const logout = useAppLogout();

  if (!ready) {
    return (
      <Button disabled size="sm" style={{ background: 'var(--green-600)', color: '#fff' }}>
        Connect
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <Button
        size="sm"
        style={{ background: 'var(--green-600)', color: '#fff' }}
        onClick={login}
      >
        Connect
      </Button>
    );
  }

  const address = user?.wallet?.address ?? '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors"
        style={{
          borderColor: 'var(--green-200)',
          color: 'var(--green-700)',
          background: 'var(--green-50)',
        }}
      >
        {address ? truncateAddress(address) : 'Connected'}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void logout()}>Disconnect</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
