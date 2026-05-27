import 'server-only';
import { PrivyClient } from '@privy-io/node';
import { createSecureClient, OrderSide } from '@polymarket/client';
import { fetchTickSize } from '@polymarket/client/actions';
import { builderApiKey } from '@polymarket/client/node';
import { signerFrom } from '@polymarket/client/privy';
import { clientEnv, serverEnv } from './env';
import type { ClobCreds } from './polymarket-user-creds';
import { roundToTick } from './tick';
import { polygonClient } from './viem';

// Server-side Polymarket trading via the unified SDK with Privy *session signer*
// signing. The user's embedded EOA signs on the server (no key in the browser) under
// TEE execution: the server authorizes each Privy call with the session signer's
// private key. The Builder API key authorizes gasless setup on the user's behalf and
// stays server-side only.

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

// TEE execution requires the server to authorize each signing call with the session
// signer's private key, which the user granted access to during trading setup.
function buildSigner(walletId: string) {
  const authKey = serverEnv.PRIVY_AUTHORIZATION_KEY;
  if (!authKey) {
    throw new Error('PRIVY_AUTHORIZATION_KEY is not configured for session signing');
  }
  return signerFrom({
    privy: nodePrivy(),
    walletId,
    authorizationContext: { authorization_private_keys: [authKey] },
  });
}

// Builder API key authorizes relaying gasless txs on the *user's* behalf, where the
// tx `from` is the user's wallet (not ours). relayerApiKey would require from == auth.
const builderKey = () =>
  builderApiKey({
    key: serverEnv.POLYMARKET_BUILDER_API_KEY,
    secret: serverEnv.POLYMARKET_BUILDER_SECRET,
    passphrase: serverEnv.POLYMARKET_BUILDER_PASSPHRASE,
  });

export interface SetupResult {
  creds: ClobCreds;
  walletAddress: `0x${string}`;
}

// Ensures the user's gasless trading wallet + approvals are set up, returning the CLOB
// credentials and the deposit wallet address to persist. Runs the SDK's setup
// transparently if not ready.
export async function setupTrading(embedded: EmbeddedWallet): Promise<SetupResult> {
  let client = await createSecureClient({
    signer: buildSigner(embedded.walletId),
    apiKey: builderKey(),
  });

  const readyBefore = await client.isGaslessReady();
  console.log('[trading-setup] start', { eoa: embedded.address, readyBefore });

  // Bind to the gasless deposit wallet (idempotent: deploys or reuses the signer's
  // deterministic Deposit Wallet). Polymarket requires the deposit wallet — not the
  // signing EOA — to be the order maker, so order placement must use this address.
  client = await client.setupGaslessWallet();

  if (!(await client.isGaslessReady())) {
    const handle = await client.setupTradingApprovals();
    await handle.wait();
  }

  const walletAddress = client.account.wallet as `0x${string}`;

  // Verify setup actually completed. Polymarket deposit wallets are NOT counterfactual —
  // an undeployed address can't hold collateral or be an order maker — so confirm both
  // gasless readiness and real on-chain bytecode, and fail loudly if either is missing.
  const ready = await client.isGaslessReady();
  const code = await polygonClient.getCode({ address: walletAddress });
  const deployed = Boolean(code) && code !== '0x';
  console.log('[trading-setup] done', { depositWallet: walletAddress, ready, deployed });
  if (!ready) {
    throw new Error('Trading setup failed: gasless wallet not ready (isGaslessReady=false)');
  }
  if (!deployed) {
    throw new Error(`Trading setup failed: deposit wallet ${walletAddress} not deployed on-chain`);
  }

  // Re-authenticate bound to the deposit wallet so the derived CLOB API key is *owned
  // by* the deposit wallet. For POLY_1271 orders the SDK sets order.signer = deposit
  // wallet, and the CLOB requires order.signer == the API key's address; an EOA-owned
  // key fails with "order signer address has to be the address of the API KEY".
  const boundClient = await createSecureClient({
    signer: buildSigner(embedded.walletId),
    apiKey: builderKey(),
    wallet: walletAddress,
  });

  return { creds: boundClient.credentials, walletAddress };
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
  depositWallet: string,
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  // Bind the client to the user's deposit wallet so it's the order maker — Polymarket
  // rejects orders made directly by the EOA. Reuse stored creds (no relayer key needed
  // for posting). SecureClientOptions is apiKey XOR credentials; stored creds are plain
  // strings vs the SDK's branded types.
  const client = await createSecureClient({
    signer: buildSigner(embedded.walletId),
    wallet: depositWallet,
    credentials: creds as unknown as NonNullable<
      Parameters<typeof createSecureClient>[0]['credentials']
    >,
  });

  // The CLOB rejects prices that aren't exact multiples of the market's tick size, so
  // fetch the authoritative tick and round before submitting.
  const tickSize = Number(await fetchTickSize(client, { tokenId: input.tokenId }));
  const price = roundToTick(input.price, tickSize);

  const builderCode = serverEnv.POLYMARKET_BUILDER_CODE;
  const response = await client.placeLimitOrder({
    tokenId: input.tokenId,
    side: input.side === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
    price,
    size: input.size,
    ...(builderCode ? { builderCode: builderCode as `0x${string}` } : {}),
  });

  return { ok: Boolean(response.ok), orderId: response.ok ? response.orderId : null };
}
