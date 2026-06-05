import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Save } from "lucide-react";

import { updateProductAction } from "@/app/admin/products/actions";
import { StockFields } from "@/app/admin/products/StockFields";
import { PageHeader, PrimaryButton, SectionCard, StatusBadge, inputClassName } from "@/components/ui";
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
    <div className="space-y-5">
      <PageHeader
        title="Edit product"
        description="Update prices, stock, and whether this product can be used in sales screens."
        actions={
          <Link
            href="/admin/products"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
        }
      />

      <SectionCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">{product.name}</h2>
            <p className="text-sm text-zinc-600">Current stock: {product.stock_units} units</p>
          </div>
          <StatusBadge tone={product.is_active ? "good" : "neutral"}>
            {product.is_active ? "Active" : "Inactive"}
          </StatusBadge>
        </div>

        <form action={updateProductAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={product.id} />

          <Field label="Product name" name="name" required defaultValue={product.name} />
          <Field label="Pack size" name="packSize" type="number" required defaultValue={product.pack_size} />
          <Field label="Cost per pack (GHS)" name="costPricePerPack" type="number" step="0.01" required defaultValue={product.cost_price_per_pack} />
          <Field label="Wholesale per pack (GHS)" name="wholesalePricePerPack" type="number" step="0.01" required defaultValue={product.wholesale_price_per_pack} />
          <Field label="Half-pack price" name="halfPackPrice" type="number" step="0.01" defaultValue={product.half_pack_price ?? ""} />
          <Field label="Retail per unit (GHS)" name="retailPricePerUnit" type="number" step="0.01" required defaultValue={product.retail_price_per_unit} />
          <Field label="Store per unit (GHS)" name="storePricePerUnit" type="number" step="0.01" required defaultValue={product.store_price_per_unit} />

          <StockFields
            initialPacks={Number(product.stock_packs ?? 0)}
            initialPieces={Number(product.stock_pieces ?? 0)}
          />

          <Field label="Low-stock mark" name="lowStockThreshold" type="number" defaultValue={product.low_stock_threshold} />

          <label className="flex min-h-11 items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 md:col-span-2">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={Boolean(product.is_active)}
              className="h-5 w-5 rounded border-zinc-300 text-zinc-900"
            />
            <span className="text-sm font-semibold text-zinc-900">Show this product in sales screens</span>
          </label>

          <div className="md:col-span-2">
            <PrimaryButton type="submit">
              <Save className="h-4 w-4" aria-hidden />
              Save changes
            </PrimaryButton>
          </div>
        </form>
      </SectionCard>
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
    <label className="block">
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
      <input
        className={inputClassName("mt-2")}
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue}
      />
    </label>
  );
}
