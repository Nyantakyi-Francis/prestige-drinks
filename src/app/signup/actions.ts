"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/db/server";

const SignupSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function signupSalespersonAction(formData: FormData) {
  const parsed = SignupSchema.safeParse({
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) redirect("/signup?error=1");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) redirect("/signup?error=1");

  const admin = getSupabaseAdmin();
  await admin.from("profiles").upsert({
    id: data.user.id,
    full_name: parsed.data.fullName,
    role: "salesperson",
  });

  redirect("/sales");
}

