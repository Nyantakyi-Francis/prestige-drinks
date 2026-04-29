import { formatISO, startOfDay, subDays } from "date-fns";
import { connection } from "next/server";

import { getSupabaseAdmin, requireUser } from "@/lib/db/server";
import { splitStockUnits } from "@/lib/stock";

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
  for (const s of (sales ?? []) as unknown[]) {
    const row = s as Record<string, unknown>;
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
    .order("name");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Weekly Returns</h1>
        <p className="text-sm text-zinc-600">
          Rolling 7-day window ({start.toISOString().slice(0, 10)} to{" "}
          {end.toISOString().slice(0, 10)}).
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-600">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Sold (units)</th>
              <th className="px-3 py-2">Revenue</th>
              <th className="px-3 py-2">Stock Left</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => {
              const s = byProduct.get(p.id) ?? { name: p.name, units: 0, revenue: 0 };
              const stock = splitStockUnits(
                Number(p.stock_units ?? 0),
                Number(p.pack_size ?? 0),
              );
              return (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">{s.units}</td>
                  <td className="px-3 py-2">GHS {s.revenue.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    {stock.packSize > 0 ? (
                      <>
                        {stock.packs} packs, {stock.units} units{" "}
                        <span className="text-xs text-zinc-500">
                          ({stock.totalUnits} units)
                        </span>
                      </>
                    ) : (
                      <>{stock.totalUnits} units</>
                    )}
                  </td>
                </tr>
              );
            })}
            {products?.length ? null : (
              <tr>
                <td className="px-3 py-4 text-zinc-600" colSpan={4}>
                  No products yet.
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
