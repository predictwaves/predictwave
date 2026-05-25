import {
  Chain,
  ExchangeOrderBuilder,
  OrderSide,
  OrderType,
  SignatureType,
  ClobClient,
  getContractConfig,
  COLLATERAL_TOKEN_DECIMALS,
  type EIP712TypedData,
  type OrderData,
  type SignedOrder,
} from '@polymarket/clob-client';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import { encodeFunctionData, parseUnits } from 'viem';
import { serverEnv } from './env';

const CHAIN_ID = Chain.POLYGON;
const { exchange: POLYMARKET_CTF_EXCHANGE, negRiskExchange: POLYMARKET_NEG_RISK_EXCHANGE } =
  getContractConfig(CHAIN_ID);
const USDC_E_ADDRESS = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' as const;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// --- Tick-size-driven rounding (mirrors @polymarket/clob-client order-builder helpers) ---
type TickSize = '0.1' | '0.01' | '0.001' | '0.0001';
interface RoundConfig {
  price: number;
  size: number;
  amount: number;
}
const ROUNDING_CONFIG: Record<TickSize, RoundConfig> = {
  '0.1': { price: 1, size: 2, amount: 3 },
  '0.01': { price: 2, size: 2, amount: 4 },
  '0.001': { price: 3, size: 2, amount: 5 },
  '0.0001': { price: 4, size: 2, amount: 6 },
};

function decimalPlaces(num: number): number {
  if (Number.isInteger(num)) return 0;
  const arr = num.toString().split('.');
  return arr.length <= 1 ? 0 : (arr[1]?.length ?? 0);
}
function roundNormal(num: number, decimals: number): number {
  if (decimalPlaces(num) <= decimals) return num;
  return Math.round((num + Number.EPSILON) * 10 ** decimals) / 10 ** decimals;
}
function roundDown(num: number, decimals: number): number {
  if (decimalPlaces(num) <= decimals) return num;
  return Math.floor(num * 10 ** decimals) / 10 ** decimals;
}
function roundUp(num: number, decimals: number): number {
  if (decimalPlaces(num) <= decimals) return num;
  return Math.ceil(num * 10 ** decimals) / 10 ** decimals;
}

// Mirrors helpers.getOrderRawAmounts so the signed amounts match what the CLOB expects.
function getOrderRawAmounts(
  side: 'BUY' | 'SELL',
  sizeShares: number,
  price: number,
  cfg: RoundConfig,
): { rawMakerAmt: number; rawTakerAmt: number } {
  const rawPrice = roundNormal(price, cfg.price);
  if (side === 'BUY') {
    const rawTakerAmt = roundDown(sizeShares, cfg.size);
    let rawMakerAmt = rawTakerAmt * rawPrice;
    if (decimalPlaces(rawMakerAmt) > cfg.amount) {
      rawMakerAmt = roundUp(rawMakerAmt, cfg.amount + 4);
      if (decimalPlaces(rawMakerAmt) > cfg.amount) rawMakerAmt = roundDown(rawMakerAmt, cfg.amount);
    }
    return { rawMakerAmt, rawTakerAmt };
  }
  const rawMakerAmt = roundDown(sizeShares, cfg.size);
  let rawTakerAmt = rawMakerAmt * rawPrice;
  if (decimalPlaces(rawTakerAmt) > cfg.amount) {
    rawTakerAmt = roundUp(rawTakerAmt, cfg.amount + 4);
    if (decimalPlaces(rawTakerAmt) > cfg.amount) rawTakerAmt = roundDown(rawTakerAmt, cfg.amount);
  }
  return { rawMakerAmt, rawTakerAmt };
}

function priceValid(price: number, tickSize: string): boolean {
  const t = Number.parseFloat(tickSize);
  return price >= t && price <= 1 - t;
}

// A signer stub: ExchangeOrderBuilder.buildOrder validates that orderData.signer
// equals the configured signer's address, and L2 header creation reads the address.
// Neither path needs a private key here (the order is signed client-side via Privy;
// L2 auth is an HMAC of the API secret), so getAddress() is all that's required.
function addressSigner(address: string) {
  return {
    getAddress: async () => address,
    _signTypedData: async () => {
      throw new Error('addressSigner cannot sign — signing happens client-side via Privy');
    },
  };
}

let _readClient: ClobClient | null = null;
function getReadClient(): ClobClient {
  if (_readClient) return _readClient;
  _readClient = new ClobClient(serverEnv.POLYMARKET_API_HOST, CHAIN_ID);
  return _readClient;
}

let _submitClient: ClobClient | null = null;
function getSubmitClient(): ClobClient {
  if (_submitClient) return _submitClient;
  const ownerAddress = serverEnv.POLYMARKET_API_ADDRESS;
  if (!ownerAddress) {
    throw new Error('POLYMARKET_API_ADDRESS is not configured — cannot authenticate order submission');
  }
  const creds = {
    key: serverEnv.POLYMARKET_API_KEY,
    secret: serverEnv.POLYMARKET_API_SECRET,
    passphrase: serverEnv.POLYMARKET_API_PASSPHRASE,
  };
  // Polymarket's builder program reuses the trading creds. Attaching a BuilderConfig
  // makes postOrder add POLY_BUILDER_* HMAC headers, which is how trades get attributed
  // to PredictWaves for the revenue split.
  const builderConfig = new BuilderConfig({ localBuilderCreds: creds });
  _submitClient = new ClobClient(
    serverEnv.POLYMARKET_API_HOST,
    CHAIN_ID,
    // biome-ignore lint/suspicious/noExplicitAny: SDK accepts an ethers-style signer; our stub only needs getAddress for L2 HMAC headers.
    addressSigner(ownerAddress) as any,
    creds,
    undefined, // signatureType (per-order; set on each order instead)
    undefined, // funderAddress (maker funds its own order — set per order)
    undefined, // geoBlockToken
    undefined, // useServerTime
    builderConfig,
  );
  return _submitClient;
}

async function resolveTickSize(tokenId: string): Promise<TickSize> {
  try {
    const t = await getReadClient().getTickSize(tokenId);
    if (t in ROUNDING_CONFIG) return t as TickSize;
  } catch {
    // fall through to default
  }
  return '0.01';
}

export interface PrepareOrderInput {
  conditionId: string;
  tokenId: string;
  side: 'BUY' | 'SELL';
  priceUsdc: number; // 0..1 (probability == price in USDC)
  sizeUsdc: number; // USDC notional the user wants to spend
  makerAddress: `0x${string}`;
}

export interface PreparedOrder {
  typedData: EIP712TypedData;
  orderHash: `0x${string}`;
  expectedShares: number;
  expectedFeeUsdc: number;
}

export async function prepareOrder(input: PrepareOrderInput): Promise<PreparedOrder> {
  const { tokenId, side, priceUsdc, sizeUsdc, makerAddress } = input;

  const tickSize = await resolveTickSize(tokenId);
  if (!priceValid(priceUsdc, tickSize)) {
    throw new Error(
      `Invalid price ${priceUsdc} (tick ${tickSize}; allowed ${Number.parseFloat(tickSize)}–${1 - Number.parseFloat(tickSize)})`,
    );
  }

  const [negRisk, feeRateBps] = await Promise.all([
    getReadClient()
      .getNegRisk(tokenId)
      .catch(() => false),
    getReadClient()
      .getFeeRateBps(tokenId)
      .catch(() => 0),
  ]);

  // Shares purchasable: at price p, sizeUsdc buys sizeUsdc / p shares.
  const sizeShares = sizeUsdc / priceUsdc;
  const cfg = ROUNDING_CONFIG[tickSize];
  const { rawMakerAmt, rawTakerAmt } = getOrderRawAmounts(side, sizeShares, priceUsdc, cfg);

  const makerAmount = parseUnits(rawMakerAmt.toString(), COLLATERAL_TOKEN_DECIMALS).toString();
  const takerAmount = parseUnits(rawTakerAmt.toString(), COLLATERAL_TOKEN_DECIMALS).toString();

  const orderData: OrderData = {
    maker: makerAddress,
    taker: ZERO_ADDRESS,
    tokenId,
    makerAmount,
    takerAmount,
    side: side === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
    feeRateBps: feeRateBps.toString(),
    nonce: '0',
    signer: makerAddress,
    expiration: '0',
    signatureType: SignatureType.EOA,
  };

  const exchange = negRisk ? POLYMARKET_NEG_RISK_EXCHANGE : POLYMARKET_CTF_EXCHANGE;
  // biome-ignore lint/suspicious/noExplicitAny: builder only needs getAddress for the maker===signer check below.
  const builder = new ExchangeOrderBuilder(exchange, CHAIN_ID, addressSigner(makerAddress) as any);
  const order = await builder.buildOrder(orderData);
  const typedData = builder.buildOrderTypedData(order);
  const orderHash = builder.buildOrderHash(typedData) as `0x${string}`;

  const expectedShares = side === 'BUY' ? rawTakerAmt : rawMakerAmt;
  const expectedFeeUsdc = sizeUsdc * (feeRateBps / 10_000);

  return { typedData, orderHash, expectedShares: Math.floor(expectedShares), expectedFeeUsdc };
}

export interface SubmitResult {
  orderId: string | null;
  status: string;
  message: string;
}

export async function submitSignedOrder(args: {
  typedData: EIP712TypedData;
  signature: `0x${string}`;
  orderHash: `0x${string}`;
  conditionId: string;
}): Promise<SubmitResult> {
  const msg = args.typedData.message as Record<string, string | number>;
  const signedOrder: SignedOrder = {
    salt: String(msg.salt),
    maker: String(msg.maker),
    signer: String(msg.signer),
    taker: String(msg.taker),
    tokenId: String(msg.tokenId),
    makerAmount: String(msg.makerAmount),
    takerAmount: String(msg.takerAmount),
    expiration: String(msg.expiration),
    nonce: String(msg.nonce),
    feeRateBps: String(msg.feeRateBps),
    side: Number(msg.side) as OrderSide,
    signatureType: Number(msg.signatureType) as SignatureType,
    signature: args.signature,
  };

  const res = (await getSubmitClient().postOrder(signedOrder, OrderType.GTC)) as Record<
    string,
    unknown
  >;
  return {
    orderId: (res.orderID as string) ?? (res.orderId as string) ?? null,
    status: (res.status as string) ?? (res.success ? 'matched' : 'unknown'),
    message: (res.errorMsg as string) ?? (res.message as string) ?? 'Order submitted',
  };
}

export interface UserPosition {
  conditionId: string;
  question: string;
  outcomeName: string;
  shares: number;
  averagePriceUsdc: number;
  currentPriceUsdc: number;
  valueUsdc: number;
  pnlUsdc: number;
}

// Polymarket exposes positions via its Data API (data-api.polymarket.com), not the
// CLOB client. Returns [] on any failure so the UI degrades gracefully.
export async function getUserPositions(address: `0x${string}`): Promise<UserPosition[]> {
  try {
    const url = `https://data-api.polymarket.com/positions?user=${address}&sizeThreshold=0.1`;
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) return [];
    const rows = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => {
      const shares = Number(r.size ?? 0);
      const avg = Number(r.avgPrice ?? 0);
      const cur = Number(r.curPrice ?? 0);
      const value = Number(r.currentValue ?? shares * cur);
      return {
        conditionId: String(r.conditionId ?? ''),
        question: String(r.title ?? r.question ?? ''),
        outcomeName: String(r.outcome ?? ''),
        shares,
        averagePriceUsdc: avg,
        currentPriceUsdc: cur,
        valueUsdc: value,
        pnlUsdc: Number(r.cashPnl ?? value - shares * avg),
      };
    });
  } catch {
    return [];
  }
}

// --- USDC approval helpers ---
const ERC20_APPROVE_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const ERC20_ALLOWANCE_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function buildUsdcApprovalTx(amount: bigint = 2n ** 256n - 1n) {
  return {
    to: USDC_E_ADDRESS,
    data: encodeFunctionData({
      abi: ERC20_APPROVE_ABI,
      functionName: 'approve',
      args: [POLYMARKET_CTF_EXCHANGE as `0x${string}`, amount],
    }),
  };
}

export { USDC_E_ADDRESS, POLYMARKET_CTF_EXCHANGE, ERC20_ALLOWANCE_ABI };
