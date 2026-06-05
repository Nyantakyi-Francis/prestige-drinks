import "server-only";

import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getUserAndRole, type UserRole } from "@/lib/auth";

export async function requireUser() {
  const { user, role } = await getUserAndRole();
  if (!user || !role) redirect("/login");
  return { user, role };
}

export async function requireRole(required: UserRole) {
  const { user, role } = await requireUser();
  if (role !== required) redirect(role === "admin" ? "/admin" : "/sales");
  return { user, role };
}

export { env, getSupabaseAdmin };
