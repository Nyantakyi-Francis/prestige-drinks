import { addDays, formatISO, startOfDay, subDays } from "date-fns";
import { AlertTriangle, Banknote, TrendingUp } from "lucide-react";
import { connection } from "next/server";

import {
  EmptyState,
  MetricTile,
  PageHeader,
  ProductStockSummary,
  SectionCard,
  StatusBadge,
} from "@/components/ui";
import { getSupabaseAdmin, requireRole } from "@/lib/db/server";

export default async function AdminOverviewPage() {
  await connection();
  await requireRole("admin");
  const db = getSupabaseAdmin();

  const todayStart = startOfDay(new Date());
  const todayEnd = addDays(todayStart, 1);
  const weekStart = subDays(todayStart, 6);

  const [{ data: today }, { data: week }, { data: products }] = await Promise.all([
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
      .select("id,name,stock_units,low_stock_threshold,pack_size,is_active")
      .eq("is_active", true)
      .order("stock_units", { ascending: true }),
  ]);

  const todaySum = sum(today as unknown[]);
  const weekSum = sum(week as unknown[]);
  const lowStock = (products ?? []).filter(
    (product) => product.stock_units <= product.low_stock_threshold,
  );
  const zeroStock = lowStock.filter((product) => product.stock_units === 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Overview"
        description="See the day's money and the stock that needs attention first."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="Sales today"
          value={`GHS ${todaySum.revenue.toFixed(2)}`}
          helper={`Profit: GHS ${todaySum.profit.toFixed(2)}`}
          icon={<Banknote className="h-5 w-5" aria-hidden />}
        />
        <MetricTile
          label="Rolling 7 days"
          value={`GHS ${weekSum.revenue.toFixed(2)}`}
          helper={`Profit: GHS ${weekSum.profit.toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5" aria-hidden />}
        />
        <MetricTile
          label="Stock alerts"
          value={`${lowStock.length}`}
          helper={zeroStock.length ? `${zeroStock.length} products are at zero.` : "No zero-stock products."}
          tone={lowStock.length ? "warn" : "good"}
          icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
        />
      </div>

      <SectionCard>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-950">Low stock</h2>
          <StatusBadge tone={lowStock.length ? "warn" : "good"}>
            {lowStock.length ? "Needs action" : "All good"}
          </StatusBadge>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {lowStock.length ? (
            lowStock.map((product) => (
              <div
                key={product.id}
                className="rounded-md border border-amber-200 bg-amber-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-zinc-950">{product.name}</div>
                  <StatusBadge tone={product.stock_units === 0 ? "danger" : "warn"}>
                    {product.stock_units === 0 ? "Zero" : "Low"}
                  </StatusBadge>
                </div>
                <div className="mt-1 text-sm text-zinc-700">
                  <ProductStockSummary
                    stockUnits={Number(product.stock_units ?? 0)}
                    packSize={Number(product.pack_size ?? 0)}
                  />
                  <span> / threshold {product.low_stock_threshold}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="sm:col-span-2">
              <EmptyState
                title="No low-stock products"
                body="Active products are currently above their low-stock marks."
              />
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function sum(rows: unknown[] | null | undefined): { revenue: number; profit: number } {
  return (rows ?? []).reduce<{ revenue: number; profit: number }>(
    (acc, row) => {
      const r = row as Record<string, unknown>;
      acc.revenue += Number(r.total_revenue ?? 0);
      acc.profit += Number(r.profit ?? 0);
      return acc;
    },
    { revenue: 0, profit: 0 },
  );
}
