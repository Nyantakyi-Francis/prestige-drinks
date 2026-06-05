import { addDays, formatISO, startOfDay } from "date-fns";
import { AlertTriangle, CheckCircle2, PackagePlus, ShoppingCart } from "lucide-react";
import { connection } from "next/server";

import {
  ActionLink,
  EmptyState,
  MetricTile,
  PageHeader,
  ProductStockSummary,
  SectionCard,
  StatusBadge,
} from "@/components/ui";
import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

function businessDateUtc(date = new Date()) {
  return formatISO(startOfDay(date), { representation: "date" });
}

export default async function SalesHomePage() {
  await connection();
  const { user, role } = await requireUser();
  const db = getSupabaseAdmin();

  const todayStart = startOfDay(new Date());
  const todayEnd = addDays(todayStart, 1);
  const businessDate = businessDateUtc();

  const salesQuery = db
    .from("sales")
    .select(
      "id,sold_at,quantity_units,total_revenue,sale_type,sale_unit_type,product:products(name)",
    )
    .gte("sold_at", formatISO(todayStart))
    .lt("sold_at", formatISO(todayEnd))
    .order("sold_at", { ascending: false });

  if (role === "salesperson") salesQuery.eq("user_id", user.id);

  const submissionQuery = db
    .from("daily_submissions")
    .select("submitted_at")
    .eq("user_id", user.id)
    .eq("business_date", businessDate)
    .maybeSingle();

  const [{ data: sales }, { data: submission }, { data: lowStock }] = await Promise.all([
    salesQuery.limit(5),
    submissionQuery,
    db
      .from("products")
      .select("id,name,stock_units,low_stock_threshold,pack_size")
      .eq("is_active", true)
      .order("stock_units", { ascending: true })
      .limit(6),
  ]);

  const totals = (sales ?? []).reduce(
    (acc, sale) => {
      acc.revenue += Number(sale.total_revenue ?? 0);
      acc.units += Number(sale.quantity_units ?? 0);
      return acc;
    },
    { revenue: 0, units: 0 },
  );

  const alertRows = (lowStock ?? []).filter(
    (product) => product.stock_units <= product.low_stock_threshold,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Today"
        description="Start here for the work that matters most today."
        actions={
          <>
            <ActionLink href="/sales/sales/new">
              <ShoppingCart className="h-4 w-4" aria-hidden />
              Record sale
            </ActionLink>
            <ActionLink href="/sales/goods-in" variant="secondary">
              <PackagePlus className="h-4 w-4" aria-hidden />
              Goods in
            </ActionLink>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="Sales today"
          value={`GHS ${totals.revenue.toFixed(2)}`}
          helper={`${totals.units} units sold`}
          icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
        />
        <MetricTile
          label="Day status"
          value={submission ? "Submitted" : "Open"}
          helper={submission ? "Sales are locked for you." : "You can still record sales."}
          tone={submission ? "good" : "info"}
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
        />
        <MetricTile
          label="Stock alerts"
          value={`${alertRows.length}`}
          helper={alertRows.length ? "Items need attention." : "No low-stock alerts."}
          tone={alertRows.length ? "warn" : "good"}
          icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-950">Recent sales</h2>
            <ActionLink href="/sales/sales/today" variant="secondary">
              View all
            </ActionLink>
          </div>
          <div className="mt-3 space-y-2">
            {(sales ?? []).length ? (
              (sales ?? []).map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-zinc-950">
                      {getProductName(sale.product)}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600">
                      {sale.quantity_units} units - {sale.sale_type} / {sale.sale_unit_type}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold">GHS {Number(sale.total_revenue).toFixed(2)}</div>
                    <div className="text-sm text-zinc-500">
                      {new Date(sale.sold_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No sales yet"
                body="Record the first sale and it will appear here."
              />
            )}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-950">Stock to watch</h2>
            <StatusBadge tone={alertRows.length ? "warn" : "good"}>
              {alertRows.length ? "Needs restock" : "OK"}
            </StatusBadge>
          </div>
          <div className="mt-3 space-y-2">
            {alertRows.length ? (
              alertRows.map((product) => (
                <div key={product.id} className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <div className="font-semibold text-zinc-950">{product.name}</div>
                  <div className="mt-1 text-sm text-zinc-700">
                    <ProductStockSummary
                      stockUnits={Number(product.stock_units ?? 0)}
                      packSize={Number(product.pack_size ?? 0)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-600">All active products are above their low-stock marks.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function getProductName(product: unknown) {
  if (!product) return "Unknown product";
  if (Array.isArray(product)) return product[0]?.name ?? "Unknown product";
  return (product as Record<string, unknown>).name?.toString() ?? "Unknown product";
}
