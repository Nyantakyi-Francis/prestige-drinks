import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "salesperson";

export async function getUserAndRole() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null as UserRole | null, fullName: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    role: (profile?.role ?? null) as UserRole | null,
    fullName: profile?.full_name ?? null,
  };
}
