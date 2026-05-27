import { createSecureClient, OrderSide, remoteBuilderSigning } from '@polymarket/client';
import { fetchTickSize, updateBalanceAllowance } from '@polymarket/client/actions';
import { signerFrom } from '@polymarket/client/viem';
import { createWalletClient, custom, type EIP1193Provider, type WalletClient } from 'viem';
import { polygon } from 'viem/chains';
import { clientEnv } from './env';
import { roundToTick } from './tick';

// Client-side Polymarket trading. Signing happens in the browser via the user's Privy
// embedded wallet (viem WalletClient); the builder secret stays server-side behind
// remoteBuilderSigning -> /api/polymarket/sign. CLOB creds are cached in localStorage.

export interface ClobCreds {
  key: string;
  secret: string;
  passphrase: string;
}

export interface TradingSetup {
  creds: ClobCreds;
  // The user's Polymarket deposit wallet — the order maker, not the signing EOA.
  depositWallet: `0x${string}`;
}

// EIP-1193 provider exposed by a Privy embedded wallet.
interface PrivyWallet {
  address: string;
  getEthereumProvider: () => Promise<unknown>;
}

export async function buildWalletClient(wallet: PrivyWallet): Promise<WalletClient> {
  const provider = (await wallet.getEthereumProvider()) as EIP1193Provider;
  return createWalletClient({
    account: wallet.address as `0x${string}`,
    chain: polygon,
    transport: custom(provider),
  });
}

// Privy access-token getter, threaded to the remote builder-signing endpoint so it can
// authenticate the caller before signing with our builder credentials.
type GetAccessToken = () => Promise<string | null>;

const builderAuth = (getAccessToken: GetAccessToken) =>
  remoteBuilderSigning({
    url: '/api/polymarket/sign',
    headers: async () => {
      const token = await getAccessToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });

// Re-scan the deposit wallet's collateral so the CLOB doesn't match against a stale
// zero. The SDK derives signature_type (3/POLY_1271) from the bound wallet type.
async function refreshCollateralCache(
  client: Awaited<ReturnType<typeof createSecureClient>>,
): Promise<void> {
  await updateBalanceAllowance(client, {
    assetType: 'COLLATERAL',
  } as unknown as Parameters<typeof updateBalanceAllowance>[1]);
}

const storageKey = (address: string) => `pw:clob:${address.toLowerCase()}`;

export function loadSetup(address: string): TradingSetup | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(address));
    return raw ? (JSON.parse(raw) as TradingSetup) : null;
  } catch {
    return null;
  }
}

export function saveSetup(address: string, setup: TradingSetup): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(address), JSON.stringify(setup));
}

// Clears all cached CLOB credentials. Called on logout so a shared device doesn't leak
// trading credentials to the next user.
export function clearAllTradingSetups(): void {
  if (typeof window === 'undefined') return;
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith('pw:clob:')) window.localStorage.removeItem(key);
  }
}

// Deploys/reuses the gasless deposit wallet + approvals and derives CLOB credentials
// owned by the deposit wallet. Idempotent.
export async function setupTrading(
  wallet: PrivyWallet,
  getAccessToken: GetAccessToken,
): Promise<TradingSetup> {
  const walletClient = await buildWalletClient(wallet);
  let client = await createSecureClient({
    signer: signerFrom(walletClient),
    apiKey: builderAuth(getAccessToken),
  });

  client = await client.setupGaslessWallet();

  // Always (re-)run trading approvals and wait for confirmation — it's idempotent, and
  // isGaslessReady() can report true with INCOMPLETE approvals (e.g. the Neg Risk
  // Adapter left at 0), which makes large orders fail with "allowance is not enough".
  // Running it unconditionally guarantees every required spender is approved.
  console.log('[trading-setup] running trading approvals…');
  const handle = await client.setupTradingApprovals();
  await handle.wait();
  console.log('[trading-setup] trading approvals confirmed');

  const depositWallet = client.account.wallet as `0x${string}`;
  await refreshCollateralCache(client);

  return { creds: client.credentials as ClobCreds, depositWallet };
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

// Maps raw Polymarket/CLOB errors to safe, user-facing messages. Every branch returns a
// canned string, so raw API URLs and micro-unit amounts (e.g. "1383800") never reach the
// user. Order matters: check the specific substrings before the generic fallback.
export function friendlyOrderError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes('allowance')) {
    return 'Trading approval needed — re-run trading setup to fix.';
  }
  if (m.includes('not enough balance') || m.includes('insufficient') || m.includes('balance')) {
    return 'Insufficient funds — add more pUSD via the Deposit page.';
  }
  if (m.includes('tick size') || m.includes('tick')) {
    return 'Price adjusted to the nearest valid increment — please try again.';
  }
  return "Order couldn't be placed. Please try again.";
}

// Places a GTC limit order with the deposit wallet as maker (POLY_1271). Reuses the
// cached CLOB creds; the order signature is produced client-side by the Privy wallet.
export async function placeOrder(
  wallet: PrivyWallet,
  setup: TradingSetup,
  input: PlaceOrderInput,
  getAccessToken: GetAccessToken,
): Promise<PlaceOrderResult> {
  const walletClient = await buildWalletClient(wallet);
  const client = await createSecureClient({
    signer: signerFrom(walletClient),
    wallet: setup.depositWallet,
    apiKey: builderAuth(getAccessToken),
    credentials: setup.creds as unknown as NonNullable<
      Parameters<typeof createSecureClient>[0]['credentials']
    >,
  });

  await refreshCollateralCache(client);

  const tickSize = Number(await fetchTickSize(client, { tokenId: input.tokenId }));
  const price = roundToTick(input.price, tickSize);

  const builderCode = clientEnv.NEXT_PUBLIC_POLYMARKET_BUILDER_CODE;
  const response = await client.placeLimitOrder({
    tokenId: input.tokenId,
    side: input.side === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
    price,
    size: input.size,
    ...(builderCode ? { builderCode: builderCode as `0x${string}` } : {}),
  });

  return { ok: Boolean(response.ok), orderId: response.ok ? response.orderId : null };
}
