"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/db/server";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    redirect("/login?error=1");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("confirm") || msg.includes("verified")) {
      redirect("/login?error=confirm");
    }
    redirect("/login?error=invalid");
  }

  try {
    const userId = data.user?.id;
    if (userId) {
      const db = getSupabaseAdmin();
      await db
        .from("profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", userId);
    }
  } catch {
    // ignore (column may not exist until supabase/upgrade.sql is applied)
  }

  redirect("/");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
