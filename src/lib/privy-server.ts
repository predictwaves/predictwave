import { PrivyClient } from '@privy-io/server-auth';
import { clientEnv, serverEnv } from './env';

let cached: PrivyClient | null = null;

export function getPrivyServerClient(): PrivyClient {
  if (cached) return cached;
  cached = new PrivyClient(clientEnv.NEXT_PUBLIC_PRIVY_APP_ID, serverEnv.PRIVY_APP_SECRET);
  return cached;
}
