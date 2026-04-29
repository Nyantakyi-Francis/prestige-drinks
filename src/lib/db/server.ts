import "server-only";

import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getUserAndRole, type UserRole } from "@/lib/auth";

export async function requireUser() {
  const { user, role } = await getUserAndRole();
  if (!user || !role) throw new Error("Unauthenticated");
  return { user, role };
}

export async function requireRole(required: UserRole) {
  const { user, role } = await requireUser();
  if (role !== required) throw new Error("Forbidden");
  return { user, role };
}

export { env, getSupabaseAdmin };
