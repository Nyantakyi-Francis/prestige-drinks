"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

const GoodsInSchema = z.object({
  productId: z.string().uuid(),
  unitsAdded: z.coerce.number().int().positive(),
  notes: z.string().max(500).optional(),
});

export async function goodsInAction(formData: FormData) {
  const { user } = await requireUser();
  const db = getSupabaseAdmin();

  const parsed = GoodsInSchema.safeParse({
    productId: formData.get("productId"),
    unitsAdded: formData.get("unitsAdded"),
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
  if (!parsed.success) throw new Error("Invalid goods-in input");

  const { productId, unitsAdded, notes } = parsed.data;

  const { data: product, error: prodErr } = await db
    .from("products")
    .select("id,stock_units")
    .eq("id", productId)
    .single();
  if (prodErr) throw new Error(prodErr.message);

  const newStock = product.stock_units + unitsAdded;

  const { error: updErr } = await db
    .from("products")
    .update({ stock_units: newStock, updated_at: new Date().toISOString() })
    .eq("id", productId);
  if (updErr) throw new Error(updErr.message);

  await db.from("stock_entries").insert({
    product_id: productId,
    user_id: user.id,
    units_added: unitsAdded,
    notes: notes ?? null,
  });

  await db.from("audit_logs").insert({
    actor_id: user.id,
    action: "goods_in",
    entity_type: "product",
    entity_id: productId,
    before: { stock_units: product.stock_units },
    after: { stock_units: newStock, units_added: unitsAdded },
  });

  revalidatePath("/sales/goods-in");
  revalidatePath("/sales/products");
  revalidatePath("/admin/products");
}
