import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { assertServerEnv, env } from "@/lib/env";

let client: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  assertServerEnv();
  if (client) return client;
  client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
