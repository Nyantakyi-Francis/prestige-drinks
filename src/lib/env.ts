export const env = {
  NEXT_PUBLIC_SUPABASE_URL: normalizeSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
};

export function assertServerEnv() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

export function normalizeSupabaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withoutRest = trimmed.replace(/\/rest\/v1\/?$/i, "");
  return withoutRest.replace(/\/+$/, "");
}
