"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/db/server";
import { getSupabaseAdmin } from "@/lib/db/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CreateUserSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["salesperson", "admin"]).default("salesperson"),
});

export async function createUserAction(formData: FormData) {
  await requireRole("admin");

  const parsed = CreateUserSchema.safeParse({
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "salesperson"),
  });
  if (!parsed.success) throw new Error("Invalid input");

  const db = getSupabaseAdmin();

  const { data, error } = await db.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(error?.message ?? "Failed to create user");

  const { error: profErr } = await db.from("profiles").upsert({
    id: data.user.id,
    full_name: parsed.data.fullName,
    role: parsed.data.role,
  });
  if (profErr) throw new Error(profErr.message);

  revalidatePath("/admin/users");
}

const ResetPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(6),
});

export async function resetPasswordAction(formData: FormData) {
  await requireRole("admin");
  const parsed = ResetPasswordSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) throw new Error("Invalid input");

  const db = getSupabaseAdmin();
  const { error } = await db.auth.admin.updateUserById(parsed.data.userId, {
    password: parsed.data.password,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}

const ToggleActiveSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.enum(["true", "false"]),
});

export async function toggleActiveAction(formData: FormData) {
  await requireRole("admin");
  const parsed = ToggleActiveSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    isActive: String(formData.get("isActive") ?? ""),
  });
  if (!parsed.success) throw new Error("Invalid input");

  const db = getSupabaseAdmin();
  const next = parsed.data.isActive === "true";

  const { error } = await db
    .from("profiles")
    .update({ is_active: next })
    .eq("id", parsed.data.userId);

  if (error) {
    throw new Error(
      `${error.message}. If you haven't yet, run supabase/upgrade.sql in Supabase SQL editor.`,
    );
  }

  revalidatePath("/admin/users");
}

export async function impersonateLoginAction(formData: FormData) {
  await requireRole("admin");
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Missing userId");

  const db = getSupabaseAdmin();
  const { data, error } = await db.auth.admin.generateLink({
    type: "magiclink",
    email: String(formData.get("email") ?? ""),
  });
  if (error) throw new Error(error.message);
  // This is intentionally not wired to auto-login; kept as placeholder for future "sign in as" workflows.
  return data;
}

export async function recordLastLoginNowAction() {
  // Optional helper: updates last_login_at for current user.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const db = getSupabaseAdmin();
  await db.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
}

