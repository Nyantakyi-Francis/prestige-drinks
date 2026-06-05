import { connection } from "next/server";

import { RecordSaleForm, type SaleProduct } from "@/app/sales/sales/new/RecordSaleForm";
import { EmptyState, PageHeader } from "@/components/ui";
import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

export default async function RecordSalePage() {
  await connection();
  await requireUser();
  const db = getSupabaseAdmin();
  const { data: products } = await db
    .from("products")
    .select(
      "id,name,stock_units,low_stock_threshold,pack_size,wholesale_price_per_pack,half_pack_price,retail_price_per_unit,store_price_per_unit",
    )
    .eq("is_active", true)
    .order("name");

  const rows = (products ?? []) as SaleProduct[];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Record a sale"
        description="Pick the product, choose how it was sold, and the app calculates the price and stock change."
      />
      {rows.length ? (
        <RecordSaleForm products={rows} />
      ) : (
        <EmptyState
          title="No active products"
          body="Ask an admin to add products before recording sales."
        />
      )}
    </div>
  );
}
