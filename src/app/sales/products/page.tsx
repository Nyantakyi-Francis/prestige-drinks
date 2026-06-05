import { connection } from "next/server";

import {
  EmptyState,
  PageHeader,
  ProductStockSummary,
  SectionCard,
  StatusBadge,
} from "@/components/ui";
import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

export default async function SalesProductsPage() {
  await connection();
  const { role } = await requireUser();
  const db = getSupabaseAdmin();
  const { data: products } = await db
    .from("products")
    .select(
      "id,name,pack_size,wholesale_price_per_pack,half_pack_price,retail_price_per_unit,store_price_per_unit,stock_units,low_stock_threshold",
    )
    .eq("is_active", true)
    .order("name");

  const rows = products ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock"
        description="See what is available, what is low, and the prices staff need during the day."
      />

      {rows.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((product) => {
              const low = product.stock_units <= product.low_stock_threshold;
              const zero = product.stock_units === 0;
              return (
                <SectionCard key={product.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-zinc-950">
                        {product.name}
                      </h2>
                      <div className="mt-1 text-sm text-zinc-600">
                        <ProductStockSummary
                          stockUnits={Number(product.stock_units ?? 0)}
                          packSize={Number(product.pack_size ?? 0)}
                        />
                      </div>
                    </div>
                    <StatusBadge tone={zero ? "danger" : low ? "warn" : "good"}>
                      {zero ? "Zero" : low ? "Low" : "OK"}
                    </StatusBadge>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <Price label="Retail" value={product.retail_price_per_unit} />
                    <Price label="Store" value={product.store_price_per_unit} />
                    <Price label="Wholesale pack" value={product.wholesale_price_per_pack} />
                    <Price label="Half-pack" value={product.half_pack_price ?? "N/A"} />
                  </dl>
                </SectionCard>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm md:block">
            <table className="min-w-max w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Wholesale</th>
                  <th className="px-4 py-3">Half-pack</th>
                  <th className="px-4 py-3">Retail</th>
                  <th className="px-4 py-3">Store</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((product) => {
                  const low = product.stock_units <= product.low_stock_threshold;
                  const zero = product.stock_units === 0;
                  return (
                    <tr key={product.id} className="border-t border-zinc-100">
                      <td className="px-4 py-3 font-semibold">{product.name}</td>
                      <td className="px-4 py-3">
                        <ProductStockSummary
                          stockUnits={Number(product.stock_units ?? 0)}
                          packSize={Number(product.pack_size ?? 0)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={zero ? "danger" : low ? "warn" : "good"}>
                          {zero ? "Zero" : low ? "Low" : "OK"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">GHS {Number(product.wholesale_price_per_pack).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {product.half_pack_price == null
                          ? "N/A"
                          : `GHS ${Number(product.half_pack_price).toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3">GHS {Number(product.retail_price_per_unit).toFixed(2)}</td>
                      <td className="px-4 py-3">GHS {Number(product.store_price_per_unit).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState
          title="No active products"
          body="Ask an admin to add or reactivate products."
        />
      )}

      {role === "admin" ? (
        <p className="text-sm text-zinc-600">
          You are viewing the sales stock screen. Use Admin Products for price and stock setup.
        </p>
      ) : null}
    </div>
  );
}

function Price({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <dt className="text-zinc-600">{label}</dt>
      <dd className="mt-1 font-semibold text-zinc-950">
        {typeof value === "number" ? `GHS ${Number(value).toFixed(2)}` : value}
      </dd>
    </div>
  );
}
