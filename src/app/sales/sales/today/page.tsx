import { addDays, formatISO, startOfDay } from "date-fns";
import { ShoppingCart } from "lucide-react";

import {
  EmptyState,
  MetricTile,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/ui";
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
    (acc, sale) => {
      acc.revenue += Number(sale.total_revenue);
      acc.units += sale.quantity_units;
      return acc;
    },
    { revenue: 0, units: 0 },
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales list"
        description={
          role === "admin"
            ? "All sales recorded today."
            : "Your sales for today, with totals at the top."
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricTile
          label="Revenue"
          value={`GHS ${totals.revenue.toFixed(2)}`}
          helper="Today"
          icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
        />
        <MetricTile label="Units sold" value={`${totals.units}`} helper="Today" />
      </div>

      {(sales ?? []).length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {(sales ?? []).map((sale) => (
              <SectionCard key={sale.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-zinc-950">
                      {getProductName(sale.product)}
                    </h2>
                    <div className="mt-1 text-sm text-zinc-600">
                      {sale.quantity_units} units - {new Date(sale.sold_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold text-zinc-950">
                      GHS {Number(sale.total_revenue).toFixed(2)}
                    </div>
                    <StatusBadge tone="info">
                      {sale.sale_type} / {sale.sale_unit_type}
                    </StatusBadge>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm md:block">
            <table className="min-w-max w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(sales ?? []).map((sale) => (
                  <tr key={sale.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3">{new Date(sale.sold_at).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 font-semibold">{getProductName(sale.product)}</td>
                    <td className="px-4 py-3">{sale.quantity_units} units</td>
                    <td className="px-4 py-3">{sale.sale_type} / {sale.sale_unit_type}</td>
                    <td className="px-4 py-3">GHS {Number(sale.total_revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState
          title="No sales today"
          body="Recorded sales will appear here as soon as they are saved."
        />
      )}
    </div>
  );
}

function getProductName(product: unknown) {
  if (!product) return "Unknown product";
  if (Array.isArray(product)) return product[0]?.name ?? "Unknown product";
  return (product as Record<string, unknown>).name?.toString() ?? "Unknown product";
}
