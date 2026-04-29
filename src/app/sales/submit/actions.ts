"use server";

import { revalidatePath } from "next/cache";
import { formatISO, startOfDay } from "date-fns";

import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

function businessDateUtc(date = new Date()) {
  return formatISO(startOfDay(date), { representation: "date" });
}

export async function submitTodayAction() {
  const { user, role } = await requireUser();
  if (role !== "salesperson") throw new Error("Only salespersons submit.");
  const db = getSupabaseAdmin();

  const d = businessDateUtc();
  const { error } = await db.from("daily_submissions").insert({
    user_id: user.id,
    business_date: d,
  });

  if (error && !error.message.toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }

  await db.from("audit_logs").insert({
    actor_id: user.id,
    action: "daily_submit",
    entity_type: "daily_submissions",
    after: { business_date: d },
  });

  revalidatePath("/sales/submit");
  revalidatePath("/sales/sales/today");
}
