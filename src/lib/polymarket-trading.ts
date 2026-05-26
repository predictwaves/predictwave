import 'server-only';
import { PrivyClient } from '@privy-io/node';
import { createSecureClient, OrderSide, relayerApiKey } from '@polymarket/client';
import { signerFrom } from '@polymarket/client/privy';
import { clientEnv, serverEnv } from './env';
import type { ClobCreds } from './polymarket-user-creds';

// Server-side Polymarket trading via the unified SDK with Privy *delegated* signing.
// The user's embedded EOA signs on the server (no key in the browser); the Relayer
// API key authorizes gasless setup and stays server-side only.

let _privy: PrivyClient | null = null;
function nodePrivy(): PrivyClient {
  if (!_privy) {
    _privy = new PrivyClient({
      appId: clientEnv.NEXT_PUBLIC_PRIVY_APP_ID,
      appSecret: serverEnv.PRIVY_APP_SECRET,
    });
  }
  return _privy;
}

export interface EmbeddedWallet {
  walletId: string;
  address: `0x${string}`;
  delegated: boolean;
}

// Resolves the user's Privy Ethereum embedded wallet (id + address + delegation status)
// from their Privy identity token.
export async function resolveEmbeddedWallet(idToken: string): Promise<EmbeddedWallet | null> {
  const user = await nodePrivy().users().get({ id_token: idToken });
  const accounts = (user as unknown as { linked_accounts?: Record<string, unknown>[] })
    .linked_accounts ?? [];
  const wallet = accounts.find(
    (a) =>
      a.type === 'wallet' &&
      a.chain_type === 'ethereum' &&
      a.wallet_client_type === 'privy' &&
      typeof a.id === 'string',
  );
  if (!wallet?.id || !wallet?.address) return null;
  return {
    walletId: wallet.id as string,
    address: wallet.address as `0x${string}`,
    delegated: Boolean(wallet.delegated),
  };
}

function buildSigner(walletId: string) {
  return signerFrom({ privy: nodePrivy(), walletId });
}

const relayerKey = () =>
  relayerApiKey({
    key: serverEnv.RELAYER_API_KEY,
    address: serverEnv.RELAYER_API_KEY_ADDRESS,
  });

export interface SetupResult {
  creds: ClobCreds;
  walletAddress: `0x${string}`;
}

// Ensures the user's gasless trading wallet + approvals are set up, returning the
// CLOB credentials to persist. Runs the SDK's setup transparently if not ready.
export async function setupTrading(embedded: EmbeddedWallet): Promise<SetupResult> {
  let client = await createSecureClient({
    signer: buildSigner(embedded.walletId),
    apiKey: relayerKey(),
  });

  if (!(await client.isGaslessReady())) {
    client = await client.setupGaslessWallet();
    const handle = await client.setupTradingApprovals();
    await handle.wait();
  }

  return { creds: client.credentials, walletAddress: embedded.address };
}

export interface PlaceOrderInput {
  tokenId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
}

export interface PlaceOrderResult {
  ok: boolean;
  orderId: string | null;
}

// Places a GTC limit order through a credentialed secure client, with the builder
// code attached for revenue attribution.
export async function placeOrder(
  embedded: EmbeddedWallet,
  creds: ClobCreds,
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  // Reuse stored creds (no relayer key needed for posting orders). SecureClientOptions
  // is apiKey XOR credentials; stored creds are plain strings vs the SDK's branded types.
  const client = await createSecureClient({
    signer: buildSigner(embedded.walletId),
    credentials: creds as unknown as NonNullable<
      Parameters<typeof createSecureClient>[0]['credentials']
    >,
  });

  const builderCode = serverEnv.POLYMARKET_BUILDER_CODE;
  const response = await client.placeLimitOrder({
    tokenId: input.tokenId,
    side: input.side === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
    price: input.price,
    size: input.size,
    ...(builderCode ? { builderCode: builderCode as `0x${string}` } : {}),
  });

  return { ok: Boolean(response.ok), orderId: response.ok ? response.orderId : null };
}
