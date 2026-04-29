import { formatISO, startOfDay, addDays, subDays } from "date-fns";
import { connection } from "next/server";

import { getSupabaseAdmin, requireRole } from "@/lib/db/server";
import { splitStockUnits } from "@/lib/stock";

export default async function AdminOverviewPage() {
  await connection();
  await requireRole("admin");
  const db = getSupabaseAdmin();

  const todayStart = startOfDay(new Date());
  const todayEnd = addDays(todayStart, 1);
  const weekStart = subDays(todayStart, 6);

  const [{ data: today }, { data: week }, { data: lowStock }] = await Promise.all([
    db
      .from("sales")
      .select("total_revenue,profit")
      .gte("sold_at", formatISO(todayStart))
      .lt("sold_at", formatISO(todayEnd)),
    db
      .from("sales")
      .select("total_revenue,profit")
      .gte("sold_at", formatISO(weekStart))
      .lt("sold_at", formatISO(todayEnd)),
    db
      .from("products")
      .select("id,name,stock_units,low_stock_threshold,pack_size")
      .lte("stock_units", "low_stock_threshold")
      .order("stock_units", { ascending: true }),
  ]);

  const sum = (rows: unknown[] | null | undefined) =>
    (rows ?? []).reduce<{ revenue: number; profit: number }>(
      (acc, row) => {
        const r = row as Record<string, unknown>;
        acc.revenue += Number(r.total_revenue ?? 0);
        acc.profit += Number(r.profit ?? 0);
        return acc;
      },
      { revenue: 0, profit: 0 },
    );

  const todaySum = sum(today as unknown[]);
  const weekSum = sum(week as unknown[]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Overview</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
          <div className="text-xs text-zinc-600">Sales Today</div>
          <div className="mt-1 text-lg font-semibold">
            GHS {todaySum.revenue.toFixed(2)}
          </div>
          <div className="mt-1 text-sm text-zinc-700">
            Profit: GHS {todaySum.profit.toFixed(2)}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
          <div className="text-xs text-zinc-600">Sales (Rolling 7 Days)</div>
          <div className="mt-1 text-lg font-semibold">
            GHS {weekSum.revenue.toFixed(2)}
          </div>
          <div className="mt-1 text-sm text-zinc-700">
            Profit: GHS {weekSum.profit.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
        <div className="text-sm font-semibold">Low Stock Alerts</div>
        <ul className="mt-3 space-y-2 text-sm">
          {(lowStock ?? []).length ? (
            (lowStock ?? []).map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span className="font-medium">{p.name}</span>
                <span className="text-zinc-600">
                  {(() => {
                    const s = splitStockUnits(
                      Number(p.stock_units ?? 0),
                      Number(p.pack_size ?? 0),
                    );
                    return s.packSize > 0
                      ? `${s.packs} packs, ${s.units} units (${s.totalUnits} units) / ${p.low_stock_threshold} units`
                      : `${s.totalUnits} units / ${p.low_stock_threshold} units`;
                  })()}
                </span>
              </li>
            ))
          ) : (
            <li className="text-zinc-600">No low stock products.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
