import { connection } from "next/server";

import { goodsInAction } from "@/app/sales/goods-in/actions";
import { getSupabaseAdmin, requireUser } from "@/lib/db/server";
import { splitStockUnits } from "@/lib/stock";

export default async function GoodsInPage() {
  await connection();
  await requireUser();
  const db = getSupabaseAdmin();
  const { data: products } = await db
    .from("products")
    .select("id,name,stock_units,low_stock_threshold,pack_size")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Goods In</h1>
        <p className="text-sm text-zinc-600">Record new stock received.</p>
      </div>

      <form
        action={goodsInAction}
        className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-zinc-700" htmlFor="productId">
            Product
          </label>
          <select
            id="productId"
            name="productId"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Select a product…
            </option>
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {(() => {
                  const s = splitStockUnits(
                    Number(p.stock_units ?? 0),
                    Number(p.pack_size ?? 0),
                  );
                  return s.packSize > 0
                    ? `${p.name} (stock: ${s.packs} packs, ${s.units} units — ${s.totalUnits} units)`
                    : `${p.name} (stock: ${s.totalUnits} units)`;
                })()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700" htmlFor="unitsAdded">
            Quantity Received (units)
          </label>
          <input
            id="unitsAdded"
            name="unitsAdded"
            type="number"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-zinc-700" htmlFor="notes">
            Notes (optional)
          </label>
          <input
            id="notes"
            name="notes"
            type="text"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Add to Stock
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-600">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => {
              const low = p.stock_units <= p.low_stock_threshold;
              const status = p.stock_units === 0 ? "Zero" : low ? "Low" : "OK";
              const s = splitStockUnits(
                Number(p.stock_units ?? 0),
                Number(p.pack_size ?? 0),
              );
              const cls =
                status === "Zero"
                  ? "bg-red-50"
                  : status === "Low"
                    ? "bg-amber-50"
                    : undefined;
              return (
                <tr key={p.id} className={cls}>
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
                  <td className="px-3 py-2">{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
