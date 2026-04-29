import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { updateProductAction } from "@/app/admin/products/actions";
import { StockFields } from "@/app/admin/products/StockFields";
import { getSupabaseAdmin, requireRole } from "@/lib/db/server";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  await requireRole("admin");

  const { id } = await params;
  const db = getSupabaseAdmin();
  const { data: product, error } = await db
    .from("products")
    .select(
      "id,name,pack_size,cost_price_per_pack,wholesale_price_per_pack,half_pack_price,retail_price_per_unit,store_price_per_unit,stock_units,stock_packs,stock_pieces,low_stock_threshold,is_active",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!product) redirect("/admin/products");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Edit Product</h1>
        <p className="text-sm text-zinc-600">
          Stock is saved as packs + pieces (auto-syncs units in the database).
        </p>
      </div>

      <form
        action={updateProductAction}
        className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 md:grid-cols-2"
      >
        <input type="hidden" name="id" value={product.id} />

        <Field label="Product Name" name="name" required defaultValue={product.name} />
        <Field
          label="Pack Size (units)"
          name="packSize"
          type="number"
          required
          defaultValue={product.pack_size}
        />
        <Field
          label="Cost Price / Pack (GHS)"
          name="costPricePerPack"
          type="number"
          step="0.01"
          required
          defaultValue={product.cost_price_per_pack}
        />
        <Field
          label="Wholesale Price / Pack (GHS)"
          name="wholesalePricePerPack"
          type="number"
          step="0.01"
          required
          defaultValue={product.wholesale_price_per_pack}
        />
        <Field
          label="Half Pack Price (optional)"
          name="halfPackPrice"
          type="number"
          step="0.01"
          defaultValue={product.half_pack_price ?? ""}
        />
        <Field
          label="Retail Price / Unit (GHS)"
          name="retailPricePerUnit"
          type="number"
          step="0.01"
          required
          defaultValue={product.retail_price_per_unit}
        />
        <Field
          label="Store Price / Unit (GHS)"
          name="storePricePerUnit"
          type="number"
          step="0.01"
          required
          defaultValue={product.store_price_per_unit}
        />

        <StockFields
          initialPacks={Number(product.stock_packs ?? 0)}
          initialPieces={Number(product.stock_pieces ?? 0)}
        />

        <Field
          label="Low Stock Threshold (units)"
          name="lowStockThreshold"
          type="number"
          defaultValue={product.low_stock_threshold}
        />

        <div className="md:col-span-2 flex items-center gap-2">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={Boolean(product.is_active)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
          />
          <label htmlFor="isActive" className="text-sm text-zinc-700">
            Active
          </label>
        </div>

        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save Changes
          </button>
          <Link
            href="/admin/products"
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            Back
          </Link>
          <div className="ml-auto text-xs text-zinc-500">
            Current units: {product.stock_units}
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  step,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  required?: boolean;
  defaultValue?: string | number;
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
        defaultValue={defaultValue}
      />
    </div>
  );
}
