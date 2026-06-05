"use server";

import { revalidatePath } from "next/cache";
import { formatISO, startOfDay } from "date-fns";

import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

export type SubmitDayActionState = {
  status: "idle" | "success" | "error";
  title?: string;
  message?: string;
};

export const initialSubmitDayActionState: SubmitDayActionState = { status: "idle" };

function businessDateUtc(date = new Date()) {
  return formatISO(startOfDay(date), { representation: "date" });
}

export async function submitTodayAction(): Promise<SubmitDayActionState> {
  try {
    const { user, role } = await requireUser();
    if (role !== "salesperson") {
      return {
        status: "error",
        title: "Not submitted",
        message: "Only salespersons submit daily sales.",
      };
    }
    const db = getSupabaseAdmin();

    const d = businessDateUtc();
    const { error } = await db.from("daily_submissions").insert({
      user_id: user.id,
      business_date: d,
    });

    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return { status: "error", title: "Not submitted", message: error.message };
    }

    await db.from("audit_logs").insert({
      actor_id: user.id,
      action: "daily_submit",
      entity_type: "daily_submissions",
      after: { business_date: d },
    });

    revalidatePath("/sales");
    revalidatePath("/sales/submit");
    revalidatePath("/sales/sales/today");

    return {
      status: "success",
      title: "Day submitted",
      message: "Your sales for today are now locked.",
    };
  } catch (error) {
    return {
      status: "error",
      title: "Not submitted",
      message: error instanceof Error ? error.message : "Submission failed.",
    };
  }
}
