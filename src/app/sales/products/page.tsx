import { connection } from "next/server";

import { getSupabaseAdmin, requireUser } from "@/lib/db/server";
import { splitStockUnits } from "@/lib/stock";

export default async function SalesProductsPage() {
  await connection();
  const { role } = await requireUser();
  const db = getSupabaseAdmin();
  const { data: products } = await db
    .from("products")
    .select(
      "id,name,pack_size,wholesale_price_per_pack,half_pack_price,retail_price_per_unit,store_price_per_unit,stock_units,low_stock_threshold",
    )
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Available Goods</h1>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-600">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Pack</th>
              <th className="px-3 py-2">Wholesale</th>
              <th className="px-3 py-2">Half</th>
              <th className="px-3 py-2">Retail</th>
              <th className="px-3 py-2">Store</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => {
              const low = p.stock_units <= p.low_stock_threshold;
              const s = splitStockUnits(
                Number(p.stock_units ?? 0),
                Number(p.pack_size ?? 0),
              );
              return (
                <tr key={p.id} className={low ? "bg-amber-50" : undefined}>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">
                    {s.packSize > 0 ? (
                      <>
                        {s.packs} packs, {s.units} units{" "}
                        <span className="text-xs text-zinc-500">
                          ({s.totalUnits} units)
                        </span>
                      </>
                    ) : (
                      <>{s.totalUnits} units</>
                    )}
                  </td>
                  <td className="px-3 py-2">{p.pack_size}</td>
                  <td className="px-3 py-2">{p.wholesale_price_per_pack}</td>
                  <td className="px-3 py-2">{p.half_pack_price ?? "—"}</td>
                  <td className="px-3 py-2">{p.retail_price_per_unit}</td>
                  <td className="px-3 py-2">{p.store_price_per_unit}</td>
                </tr>
              );
            })}
            {products?.length ? null : (
              <tr>
                <td className="px-3 py-4 text-zinc-600" colSpan={7}>
                  No products yet. Ask an admin to add products.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {role === "admin" ? (
        <p className="text-xs text-zinc-600">
          You are logged in as admin — for full product editing use the admin
          Products page.
        </p>
      ) : null}
    </div>
  );
}
