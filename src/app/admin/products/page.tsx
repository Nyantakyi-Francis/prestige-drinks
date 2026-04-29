import { connection } from "next/server";

import {
  createProductAction,
  deactivateProductAction,
  deleteProductAction,
} from "@/app/admin/products/actions";
import { StartingStockFields } from "@/app/admin/products/StartingStockFields";
import { getSupabaseAdmin, requireRole } from "@/lib/db/server";

export default async function AdminProductsPage() {
  await connection();
  await requireRole("admin");
  const db = getSupabaseAdmin();
  const { data: products } = await db
    .from("products")
    .select(
      "id,name,pack_size,cost_price_per_pack,wholesale_price_per_pack,half_pack_price,retail_price_per_unit,store_price_per_unit,stock_units,low_stock_threshold,is_active",
    )
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Products</h1>
          <p className="text-sm text-zinc-600">
            Admin sets all prices and thresholds.
          </p>
        </div>
      </div>

      <form
        action={createProductAction}
        className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <div className="text-sm font-semibold">Add Product</div>
        </div>
        <Field label="Product Name" name="name" required />
        <Field label="Pack Size (units)" name="packSize" type="number" required />
        <Field
          label="Cost Price / Pack (GHS)"
          name="costPricePerPack"
          type="number"
          step="0.01"
          required
        />
        <Field
          label="Wholesale Price / Pack (GHS)"
          name="wholesalePricePerPack"
          type="number"
          step="0.01"
          required
        />
        <Field
          label="Half Pack Price (optional)"
          name="halfPackPrice"
          type="number"
          step="0.01"
        />
        <Field
          label="Retail Price / Unit (GHS)"
          name="retailPricePerUnit"
          type="number"
          step="0.01"
          required
        />
        <Field
          label="Store Price / Unit (GHS)"
          name="storePricePerUnit"
          type="number"
          step="0.01"
          required
        />
        <StartingStockFields />
        <Field
          label="Low Stock Threshold (units)"
          name="lowStockThreshold"
          type="number"
        />
        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Create
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-600">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Low</th>
              <th className="px-3 py-2">Pack</th>
              <th className="px-3 py-2">Cost/Pack</th>
              <th className="px-3 py-2">Wholesale/Pack</th>
              <th className="px-3 py-2">Half Pack</th>
              <th className="px-3 py-2">Retail/Unit</th>
              <th className="px-3 py-2">Store/Unit</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => {
              const low = p.stock_units <= p.low_stock_threshold;
              const packSize = Number(p.pack_size ?? 0);
              const packs =
                packSize > 0 ? Math.floor(p.stock_units / packSize) : 0;
              const units =
                packSize > 0 ? p.stock_units % packSize : p.stock_units;
              return (
                <tr key={p.id} className={low ? "bg-amber-50" : undefined}>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">
                    {packSize > 0 ? (
                      <>
                        {packs} packs, {units} units{" "}
                        <span className="text-xs text-zinc-500">
                          ({p.stock_units} units)
                        </span>
                      </>
                    ) : (
                      <>{p.stock_units} units</>
                    )}
                  </td>
                  <td className="px-3 py-2">{p.low_stock_threshold}</td>
                  <td className="px-3 py-2">{p.pack_size}</td>
                  <td className="px-3 py-2">{p.cost_price_per_pack}</td>
                  <td className="px-3 py-2">{p.wholesale_price_per_pack}</td>
                  <td className="px-3 py-2">{p.half_pack_price ?? "—"}</td>
                  <td className="px-3 py-2">{p.retail_price_per_unit}</td>
                  <td className="px-3 py-2">{p.store_price_per_unit}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        className="text-xs font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
                        href={`/admin/products/${p.id}`}
                      >
                        Edit
                      </a>
                      <form action={deactivateProductAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-600"
                        >
                          Deactivate
                        </button>
                      </form>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-700 underline underline-offset-2 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products?.length ? null : (
              <tr>
                <td className="px-3 py-4 text-zinc-600" colSpan={10}>
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

function Field({
  label,
  name,
  type = "text",
  step,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-700" htmlFor={name}>
        {label}
      </label>
      <input
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
      />
    </div>
  );
}
