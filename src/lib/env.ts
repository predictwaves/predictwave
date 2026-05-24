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
  PRIVY_APP_SECRET: z.string().min(1),
  PRIVY_WEBHOOK_SECRET: z.string().min(1),

  // Alchemy
  ALCHEMY_API_KEY: z.string().min(1),

  // Polymarket
  POLYMARKET_API_HOST: z.string().url().default('https://clob.polymarket.com'),
  POLYMARKET_API_KEY: z.string().optional(),
  POLYMARKET_API_SECRET: z.string().optional(),
  POLYMARKET_API_PASSPHRASE: z.string().optional(),

  // Supabase (service role — server only)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

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
  NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1),

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

function parseEnv<T extends z.ZodTypeAny>(schema: T, source: NodeJS.ProcessEnv): z.infer<T> {
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

export const clientEnv = parseEnv(clientSchema, process.env);

export const serverEnv = isServer
  ? parseEnv(serverSchema, process.env)
  : ({} as z.infer<typeof serverSchema>);
