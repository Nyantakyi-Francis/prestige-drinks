import { connection } from "next/server";

import { recordSaleAction } from "@/app/sales/sales/new/actions";
import { getSupabaseAdmin, requireUser } from "@/lib/db/server";
import { splitStockUnits } from "@/lib/stock";

export default async function RecordSalePage() {
  await connection();
  await requireUser();
  const db = getSupabaseAdmin();
  const { data: products } = await db
    .from("products")
    .select("id,name,stock_units,pack_size")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Record a Sale</h1>
        <p className="text-sm text-zinc-600">
          Price is auto-calculated from admin pricing.
        </p>
      </div>

      <form
        action={recordSaleAction}
        className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-zinc-700" htmlFor="productId">
            Product
          </label>
          <select
            id="productId"
            name="productId"
            required
            defaultValue=""
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            <option value="" disabled>
              Select a product…
            </option>
            {(products ?? []).map((p) => (
              <option key={String(p.id)} value={String(p.id)}>
                {(() => {
                  const s = splitStockUnits(
                    Number(p.stock_units ?? 0),
                    Number(p.pack_size ?? 0),
                  );
                  return s.packSize > 0
                    ? `${p.name} (stock: ${s.packs} packs, ${s.units} units — ${s.totalUnits} units; pack: ${s.packSize})`
                    : `${p.name} (stock: ${s.totalUnits} units; pack: ${p.pack_size})`;
                })()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700" htmlFor="saleType">
            Sale Type
          </label>
          <select
            id="saleType"
            name="saleType"
            required
            defaultValue="retail"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            <option value="wholesale">Wholesale</option>
            <option value="retail">Retail</option>
            <option value="store">Store</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700" htmlFor="saleUnitType">
            Unit Type
          </label>
          <select
            id="saleUnitType"
            name="saleUnitType"
            required
            defaultValue="unit"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            <option value="unit">Unit</option>
            <option value="pack">Pack</option>
            <option value="half_pack">Half Pack</option>
          </select>
          <div className="mt-1 text-xs text-zinc-500">
            Rule: Wholesale uses pack/half-pack; Retail/Store uses unit.
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700" htmlFor="quantity">
            Quantity (units or packs)
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <div className="mt-1 text-xs text-zinc-500">
            For pack sales, enter number of packs; for half-pack, number of half-packs.
          </div>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Record Sale
          </button>
        </div>
      </form>
    </div>
  );
}
