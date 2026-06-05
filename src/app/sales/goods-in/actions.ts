"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

export type GoodsInActionState = {
  status: "idle" | "success" | "error";
  title?: string;
  message?: string;
};

export const initialGoodsInActionState: GoodsInActionState = { status: "idle" };

const GoodsInSchema = z.object({
  productId: z.string().uuid(),
  unitsAdded: z.coerce.number().int().positive(),
  notes: z.string().max(500).optional(),
});

export async function goodsInAction(
  _prevState: GoodsInActionState,
  formData: FormData,
): Promise<GoodsInActionState> {
  try {
    const { user } = await requireUser();
    const db = getSupabaseAdmin();

    const parsed = GoodsInSchema.safeParse({
      productId: formData.get("productId"),
      unitsAdded: formData.get("unitsAdded"),
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    });
    if (!parsed.success) return errorState("Check the quantity and product.");

    const { productId, unitsAdded, notes } = parsed.data;

    const { data: product, error: prodErr } = await db
      .from("products")
      .select("id,name,stock_units,is_active")
      .eq("id", productId)
      .single();
    if (prodErr) return errorState(prodErr.message);
    if (product.is_active === false) return errorState("This product is not active.");

    const newStock = product.stock_units + unitsAdded;

    const { error: updErr } = await db
      .from("products")
      .update({ stock_units: newStock, updated_at: new Date().toISOString() })
      .eq("id", productId);
    if (updErr) return errorState(updErr.message);

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

    revalidatePath("/sales");
    revalidatePath("/sales/goods-in");
    revalidatePath("/sales/products");
    revalidatePath("/admin/products");

    return {
      status: "success",
      title: "Stock updated",
      message: `${product.name}: ${unitsAdded} units added, ${newStock} units now available.`,
    };
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Stock could not be updated.");
  }
}

function errorState(message: string): GoodsInActionState {
  return { status: "error", title: "Stock not saved", message };
}
