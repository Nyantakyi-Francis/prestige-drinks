import { formatISO, startOfDay, addDays } from "date-fns";

import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

export default async function TodaySalesPage() {
  const { user, role } = await requireUser();
  const db = getSupabaseAdmin();

  const start = startOfDay(new Date());
  const end = addDays(start, 1);

  const query = db
    .from("sales")
    .select(
      "id,sold_at,sale_type,sale_unit_type,quantity_units,unit_price,total_revenue,product:products(name)",
    )
    .gte("sold_at", formatISO(start))
    .lt("sold_at", formatISO(end))
    .order("sold_at", { ascending: false });

  if (role === "salesperson") query.eq("user_id", user.id);

  const { data: sales } = await query;

  const totals = (sales ?? []).reduce(
    (acc, s) => {
      acc.revenue += Number(s.total_revenue);
      acc.units += s.quantity_units;
      return acc;
    },
    { revenue: 0, units: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Daily Sales</h1>
          <p className="text-sm text-zinc-600">
            {role === "admin"
              ? "All sales today."
              : "Your sales today (after submission, edits are locked)."}
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold">GHS {totals.revenue.toFixed(2)}</div>
          <div className="text-xs text-zinc-600">{totals.units} units</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
        <table className="min-w-max w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-600 whitespace-nowrap">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Qty (units)</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Revenue</th>
            </tr>
          </thead>
          <tbody className="whitespace-nowrap">
            {(sales ?? []).map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2">
                  {new Date(s.sold_at).toLocaleTimeString()}
                </td>
                <td className="px-3 py-2 font-medium">
                  {getProductName(s.product)}
                </td>
                <td className="px-3 py-2">{s.quantity_units}</td>
                <td className="px-3 py-2">
                  {s.sale_type} / {s.sale_unit_type}
                </td>
                <td className="px-3 py-2">GHS {Number(s.total_revenue).toFixed(2)}</td>
              </tr>
            ))}
            {sales?.length ? null : (
              <tr>
                <td className="px-3 py-4 text-zinc-600" colSpan={5}>
                  No sales today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getProductName(product: unknown) {
  if (!product) return "Unknown";
  if (Array.isArray(product)) return product[0]?.name ?? "Unknown";
  return (product as Record<string, unknown>).name?.toString() ?? "Unknown";
}
