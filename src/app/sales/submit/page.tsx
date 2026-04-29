import { formatISO, startOfDay } from "date-fns";

import { submitTodayAction } from "@/app/sales/submit/actions";
import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

function businessDateUtc(date = new Date()) {
  return formatISO(startOfDay(date), { representation: "date" });
}

export default async function SubmitDayPage() {
  const { user, role } = await requireUser();
  const d = businessDateUtc();
  const db = getSupabaseAdmin();

  const { data: submission } = await db
    .from("daily_submissions")
    .select("submitted_at")
    .eq("user_id", user.id)
    .eq("business_date", d)
    .maybeSingle();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Submit Daily Sales</h1>
      {role !== "salesperson" ? (
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 text-sm">
          Only salespersons submit daily sales.
        </div>
      ) : submission ? (
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 text-sm">
          Submitted at {new Date(submission.submitted_at).toLocaleString()}.
          Sales for today are locked.
        </div>
      ) : (
        <form action={submitTodayAction}>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
            <p className="text-sm text-zinc-700">
              This locks today’s sales so they can’t be changed by you.
            </p>
            <button
              type="submit"
              className="mt-3 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Submit Today
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
