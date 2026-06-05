import { formatISO, startOfDay, subDays } from "date-fns";
import { connection } from "next/server";

import {
  EmptyState,
  MetricTile,
  PageHeader,
  ProductStockSummary,
  SectionCard,
} from "@/components/ui";
import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

export default async function WeeklyReturnsPage() {
  await connection();
  const { user, role } = await requireUser();
  const db = getSupabaseAdmin();

  const end = startOfDay(new Date());
  const start = subDays(end, 6);

  const query = db
    .from("sales")
    .select("quantity_units,total_revenue,product_id,product:products(name)")
    .gte("sold_at", formatISO(start))
    .lt("sold_at", formatISO(new Date(end.getTime() + 24 * 3600 * 1000)));

  if (role === "salesperson") query.eq("user_id", user.id);

  const { data: sales } = await query;

  const byProduct = new Map<string, { name: string; units: number; revenue: number }>();
  for (const sale of (sales ?? []) as unknown[]) {
    const row = sale as Record<string, unknown>;
    const key = String(row.product_id);
    const existing = byProduct.get(key) ?? {
      name: getProductName(row.product),
      units: 0,
      revenue: 0,
    };
    existing.units += Number(row.quantity_units ?? 0);
    existing.revenue += Number(row.total_revenue ?? 0);
    byProduct.set(key, existing);
  }

  const { data: products } = await db
    .from("products")
    .select("id,name,stock_units,pack_size")
    .eq("is_active", true)
    .order("name");

  const rows = (products ?? []).map((product) => ({
    ...product,
    sales: byProduct.get(product.id) ?? { name: product.name, units: 0, revenue: 0 },
  }));
  const totalRevenue = rows.reduce((sum, row) => sum + row.sales.revenue, 0);
  const totalUnits = rows.reduce((sum, row) => sum + row.sales.units, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Weekly returns"
        description={`Rolling 7-day view: ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}.`}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricTile label="Revenue" value={`GHS ${totalRevenue.toFixed(2)}`} helper="Last 7 days" />
        <MetricTile label="Units sold" value={`${totalUnits}`} helper="Last 7 days" />
      </div>

      {rows.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((row) => (
              <SectionCard key={row.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-zinc-950">{row.name}</h2>
                    <div className="mt-1 text-sm text-zinc-600">
                      Stock left:{" "}
                      <ProductStockSummary
                        stockUnits={Number(row.stock_units ?? 0)}
                        packSize={Number(row.pack_size ?? 0)}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-zinc-950">
                      GHS {row.sales.revenue.toFixed(2)}
                    </div>
                    <div className="text-sm text-zinc-600">{row.sales.units} sold</div>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm md:block">
            <table className="min-w-max w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Sold</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Stock left</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3 font-semibold">{row.name}</td>
                    <td className="px-4 py-3">{row.sales.units} units</td>
                    <td className="px-4 py-3">GHS {row.sales.revenue.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <ProductStockSummary
                        stockUnits={Number(row.stock_units ?? 0)}
                        packSize={Number(row.pack_size ?? 0)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState title="No products yet" body="Active products will appear here." />
      )}
    </div>
  );
}

function getProductName(product: unknown) {
  if (!product) return "Unknown product";
  if (Array.isArray(product)) return product[0]?.name ?? "Unknown product";
  return (product as Record<string, unknown>).name?.toString() ?? "Unknown product";
}
