import { addDays, formatISO, startOfDay } from "date-fns";

import { SubmitDayPanel } from "@/app/sales/submit/SubmitDayPanel";
import { EmptyState, PageHeader } from "@/components/ui";
import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

function businessDateUtc(date = new Date()) {
  return formatISO(startOfDay(date), { representation: "date" });
}

export default async function SubmitDayPage() {
  const { user, role } = await requireUser();
  const db = getSupabaseAdmin();
  const d = businessDateUtc();

  if (role !== "salesperson") {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Submit day"
          description="Daily submission is only needed for salesperson accounts."
        />
        <EmptyState
          title="Nothing to submit"
          body="Admins can review sales from reports without submitting a sales day."
        />
      </div>
    );
  }

  const start = startOfDay(new Date());
  const end = addDays(start, 1);

  const [{ data: submission }, { data: sales }] = await Promise.all([
    db
      .from("daily_submissions")
      .select("submitted_at")
      .eq("user_id", user.id)
      .eq("business_date", d)
      .maybeSingle(),
    db
      .from("sales")
      .select("quantity_units,total_revenue")
      .eq("user_id", user.id)
      .gte("sold_at", formatISO(start))
      .lt("sold_at", formatISO(end)),
  ]);

  const totals = (sales ?? []).reduce(
    (acc, sale) => {
      acc.revenue += Number(sale.total_revenue ?? 0);
      acc.units += Number(sale.quantity_units ?? 0);
      acc.count += 1;
      return acc;
    },
    { revenue: 0, units: 0, count: 0 },
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Submit day"
        description="When the day is finished, submit once to lock your sales."
      />
      <SubmitDayPanel
        alreadySubmitted={Boolean(submission)}
        submittedAt={submission?.submitted_at ?? null}
        revenue={totals.revenue}
        units={totals.units}
        salesCount={totals.count}
      />
    </div>
  );
}
