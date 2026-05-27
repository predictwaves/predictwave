/**
 * Centralised env access. Never read process.env directly elsewhere — use the
 * typed exports from this file so missing vars surface at boot, not at runtime.
 */
import { z } from 'zod';

const numericString = (def: number) =>
  z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default(def);

const serverSchema = z.object({
  // Privy
  PRIVY_APP_SECRET: z.string().min(50),
  PRIVY_WEBHOOK_SECRET: z.string().optional(),

  // Alchemy
  ALCHEMY_API_KEY: z.string().min(1),

  // Polymarket unified SDK (@polymarket/client) — server-side signing.
  // Relayer API key relays the *builder's own* transactions (from must == auth
  // address). Kept for other paths; NOT used for builder-on-behalf-of-user setup.
  RELAYER_API_KEY: z.string().min(1),
  RELAYER_API_KEY_ADDRESS: z.string().startsWith('0x'),
  // Builder API credentials — authorize relaying gasless transactions on behalf of
  // a user's wallet (builder-on-behalf-of-user). Used for createSecureClient setup.
  POLYMARKET_BUILDER_API_KEY: z.string().min(1),
  POLYMARKET_BUILDER_SECRET: z.string().min(1),
  POLYMARKET_BUILDER_PASSPHRASE: z.string().min(1),
  // Builder code attached to orders for revenue attribution.
  POLYMARKET_BUILDER_CODE: z.string().optional(),
  // Privy authorization private key (base64 PKCS8, no PEM headers) for the session
  // signer that signs on the user's behalf under TEE execution. Must correspond to
  // NEXT_PUBLIC_PRIVY_SESSION_SIGNER_ID's key quorum in the Privy dashboard.
  PRIVY_AUTHORIZATION_KEY: z.string().optional(),

  // Supabase (service role — server only)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AES-256-GCM key (hex, 32 bytes) for encrypting per-user CLOB creds at rest.
  CLOB_CREDS_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, 'must be 32 bytes hex'),

  // FX
  FX_SOURCE_URL: z.string().url(),
  FX_CACHE_TTL_SECONDS: numericString(300),

  // Resend
  RESEND_API_KEY: z.string().optional(),

  // Sentry
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
});

const clientSchema = z.object({
  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Privy
  NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(20),
  // Session signer (key quorum) id the user grants signing access to during trading
  // setup, so the server can sign on their behalf under TEE execution. The matching
  // private key is PRIVY_AUTHORIZATION_KEY (server-only).
  NEXT_PUBLIC_PRIVY_SESSION_SIGNER_ID: z.string().optional(),

  // Polygon
  NEXT_PUBLIC_POLYGON_RPC: z.string().url(),
  NEXT_PUBLIC_POLYMARKET_CHAIN_ID: numericString(137),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default('https://eu.i.posthog.com'),

  // Sentry
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),

  // Support
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional(),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.string().email().default('support@predictwaves.com'),
});

function parseEnv<T extends z.ZodTypeAny>(schema: T, source: Record<string, string | undefined>): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const lines = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}`)
      .join('\n');
    throw new Error(`❌ Invalid environment variables:\n${lines}`);
  }
  return result.data as z.infer<T>;
}

const isServer = typeof window === 'undefined';

// Explicitly reference each NEXT_PUBLIC_* var so Turbopack can statically inline them.
// Passing `process.env` as a whole object does not work in Turbopack — only direct
// property accesses like `process.env.NEXT_PUBLIC_FOO` are statically replaced.
const clientRuntimeEnv: Record<string, string | undefined> = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  NEXT_PUBLIC_PRIVY_SESSION_SIGNER_ID: process.env.NEXT_PUBLIC_PRIVY_SESSION_SIGNER_ID,
  NEXT_PUBLIC_POLYGON_RPC: process.env.NEXT_PUBLIC_POLYGON_RPC,
  NEXT_PUBLIC_POLYMARKET_CHAIN_ID: process.env.NEXT_PUBLIC_POLYMARKET_CHAIN_ID,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
};

export const clientEnv = parseEnv(clientSchema, clientRuntimeEnv);

export const serverEnv = isServer
  ? parseEnv(serverSchema, process.env)
  : ({} as z.infer<typeof serverSchema>);

// Unified env object — client vars available everywhere; server vars only on server.
export const env = clientEnv;
