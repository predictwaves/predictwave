import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { clientEnv, serverEnv } from '@/lib/env';

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value, options }) => { cookieStore.set(name, value, options); });
      },
    },
  });
}

export function createSupabaseAdmin() {
  return createServerClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
