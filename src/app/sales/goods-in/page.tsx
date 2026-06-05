import { connection } from "next/server";

import { GoodsInForm, type GoodsInProduct } from "@/app/sales/goods-in/GoodsInForm";
import { EmptyState, PageHeader } from "@/components/ui";
import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

export default async function GoodsInPage() {
  await connection();
  await requireUser();
  const db = getSupabaseAdmin();
  const { data: products } = await db
    .from("products")
    .select("id,name,stock_units,low_stock_threshold,pack_size")
    .eq("is_active", true)
    .order("name");

  const rows = (products ?? []) as GoodsInProduct[];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Goods in"
        description="Record new stock in a few taps and see the new stock level before saving."
      />
      {rows.length ? (
        <GoodsInForm products={rows} />
      ) : (
        <EmptyState
          title="No active products"
          body="Ask an admin to add products before recording stock."
        />
      )}
    </div>
  );
}
