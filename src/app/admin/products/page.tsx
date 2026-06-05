import Link from "next/link";
import { connection } from "next/server";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";

import {
  EmptyState,
  PageHeader,
  PrimaryButton,
  ProductStockSummary,
  SectionCard,
  StatusBadge,
  inputClassName,
} from "@/components/ui";
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

  const rows = products ?? [];
  const activeCount = rows.filter((product) => product.is_active !== false).length;
  const lowCount = rows.filter((product) => product.stock_units <= product.low_stock_threshold).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description="Add products, set prices, and spot stock problems without scanning a wide table."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Products" value={`${rows.length}`} />
        <Summary label="Active" value={`${activeCount}`} />
        <Summary label="Low stock" value={`${lowCount}`} tone={lowCount ? "warn" : "good"} />
      </div>

      <SectionCard>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-950 text-white">
            <Plus className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-zinc-950">Add product</h2>
            <p className="text-sm text-zinc-600">Start with name, pack size, prices, and starting stock.</p>
          </div>
        </div>

        <form action={createProductAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Product name" name="name" required />
          <Field label="Pack size" name="packSize" type="number" required />
          <Field label="Cost per pack (GHS)" name="costPricePerPack" type="number" step="0.01" required />
          <Field label="Wholesale per pack (GHS)" name="wholesalePricePerPack" type="number" step="0.01" required />
          <Field label="Half-pack price" name="halfPackPrice" type="number" step="0.01" />
          <Field label="Retail per unit (GHS)" name="retailPricePerUnit" type="number" step="0.01" required />
          <Field label="Store per unit (GHS)" name="storePricePerUnit" type="number" step="0.01" required />
          <StartingStockFields />
          <Field label="Low-stock mark" name="lowStockThreshold" type="number" />
          <div className="md:col-span-2">
            <PrimaryButton type="submit">
              <Plus className="h-4 w-4" aria-hidden />
              Create product
            </PrimaryButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard>
        <h2 className="text-base font-semibold text-zinc-950">Product list</h2>
        {rows.length ? (
          <>
            <div className="mt-3 grid gap-3 lg:hidden">
              {rows.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-3 hidden overflow-x-auto lg:block">
              <table className="min-w-max w-full text-sm">
                <thead className="bg-zinc-50 text-left text-zinc-600">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Pack</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Wholesale</th>
                    <th className="px-4 py-3">Retail</th>
                    <th className="px-4 py-3">Store</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((product) => (
                    <ProductRow key={product.id} product={product} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="mt-3">
            <EmptyState title="No products yet" body="Create the first product above." />
          </div>
        )}
      </SectionCard>
    </div>
  );
}

type ProductRowType = {
  id: string;
  name: string;
  pack_size: number;
  cost_price_per_pack: number;
  wholesale_price_per_pack: number;
  half_pack_price: number | null;
  retail_price_per_unit: number;
  store_price_per_unit: number;
  stock_units: number;
  low_stock_threshold: number;
  is_active: boolean | null;
};

function ProductCard({ product }: { product: ProductRowType }) {
  const low = product.stock_units <= product.low_stock_threshold;
  const inactive = product.is_active === false;
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-zinc-950">{product.name}</h3>
          <div className="mt-1 text-sm text-zinc-600">
            <ProductStockSummary stockUnits={product.stock_units} packSize={product.pack_size} />
          </div>
        </div>
        <StatusBadge tone={inactive ? "neutral" : low ? "warn" : "good"}>
          {inactive ? "Inactive" : low ? "Low" : "Active"}
        </StatusBadge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Price label="Wholesale" value={product.wholesale_price_per_pack} />
        <Price label="Retail" value={product.retail_price_per_unit} />
        <Price label="Store" value={product.store_price_per_unit} />
        <Price label="Cost" value={product.cost_price_per_pack} />
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <EditLink id={product.id} />
        <ProductAction id={product.id} action={deactivateProductAction} label="Deactivate" tone="secondary" icon="power" />
        <ProductAction id={product.id} action={deleteProductAction} label="Delete" tone="danger" icon="trash" />
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: ProductRowType }) {
  const low = product.stock_units <= product.low_stock_threshold;
  const inactive = product.is_active === false;
  return (
    <tr className="border-t border-zinc-100">
      <td className="px-4 py-3 font-semibold">{product.name}</td>
      <td className="px-4 py-3">
        <ProductStockSummary stockUnits={product.stock_units} packSize={product.pack_size} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge tone={inactive ? "neutral" : low ? "warn" : "good"}>
          {inactive ? "Inactive" : low ? "Low" : "Active"}
        </StatusBadge>
      </td>
      <td className="px-4 py-3">{product.pack_size}</td>
      <td className="px-4 py-3">GHS {Number(product.cost_price_per_pack).toFixed(2)}</td>
      <td className="px-4 py-3">GHS {Number(product.wholesale_price_per_pack).toFixed(2)}</td>
      <td className="px-4 py-3">GHS {Number(product.retail_price_per_unit).toFixed(2)}</td>
      <td className="px-4 py-3">GHS {Number(product.store_price_per_unit).toFixed(2)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <EditLink id={product.id} />
          <ProductAction id={product.id} action={deactivateProductAction} label="Deactivate" tone="secondary" icon="power" />
          <ProductAction id={product.id} action={deleteProductAction} label="Delete" tone="danger" icon="trash" />
        </div>
      </td>
    </tr>
  );
}

function ProductAction({
  id,
  action,
  label,
  tone,
  icon,
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  tone: "secondary" | "danger";
  icon: "power" | "trash";
}) {
  const Icon = icon === "power" ? Power : Trash2;
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <PrimaryButton type="submit" variant={tone}>
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </PrimaryButton>
    </form>
  );
}

function EditLink({ id }: { id: string }) {
  return (
    <Link
      href={`/admin/products/${id}`}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
    >
      <Pencil className="h-4 w-4" aria-hidden />
      Edit
    </Link>
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
    <label className="block">
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
      <input
        className={inputClassName("mt-2")}
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
      />
    </label>
  );
}

function Price({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-zinc-50 p-2">
      <dt className="text-zinc-600">{label}</dt>
      <dd className="font-semibold text-zinc-950">GHS {Number(value).toFixed(2)}</dd>
    </div>
  );
}

function Summary({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const cls =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-zinc-200 bg-white text-zinc-950";
  return (
    <div className={`rounded-lg border p-4 ${cls}`}>
      <div className="text-sm opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
