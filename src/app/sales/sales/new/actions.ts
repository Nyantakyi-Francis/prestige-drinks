"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseAdmin, requireUser } from "@/lib/db/server";

const SaleSchema = z.object({
  productId: z.string().uuid(),
  saleType: z.enum(["wholesale", "retail", "store"]),
  saleUnitType: z.enum(["unit", "pack", "half_pack"]),
  quantity: z.coerce.number().int().positive(),
});

function businessDateUtc(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function recordSaleAction(formData: FormData) {
  const { user, role } = await requireUser();
  const db = getSupabaseAdmin();
  const parsed = SaleSchema.safeParse({
    productId: formData.get("productId"),
    saleType: formData.get("saleType"),
    saleUnitType: formData.get("saleUnitType"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) throw new Error("Invalid sale input");

  if (role === "salesperson") {
    const { data: submitted } = await db
      .from("daily_submissions")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_date", businessDateUtc())
      .maybeSingle();
    if (submitted) {
      throw new Error("Today is submitted; sales are locked.");
    }
  }

  const { productId, saleType, saleUnitType, quantity } = parsed.data;

  const { data: product, error: prodErr } = await db
    .from("products")
    .select(
      "id,name,pack_size,cost_price_per_pack,wholesale_price_per_pack,half_pack_price,retail_price_per_unit,store_price_per_unit,stock_units",
    )
    .eq("id", productId)
    .single();
  if (prodErr) throw new Error(prodErr.message);

  if (saleType === "wholesale") {
    if (saleUnitType === "unit") {
      throw new Error("Wholesale must be pack or half-pack.");
    }
  } else {
    if (saleUnitType !== "unit") {
      throw new Error("Retail/Store sales are unit-only.");
    }
  }

  const packSize = product.pack_size;
  const halfPackUnits = Math.floor(packSize / 2);
  if (saleUnitType === "half_pack" && halfPackUnits <= 0) {
    throw new Error("Invalid pack size for half-pack sales.");
  }

  const quantityUnits =
    saleUnitType === "unit"
      ? quantity
      : saleUnitType === "pack"
        ? quantity * packSize
        : quantity * halfPackUnits;

  if (quantityUnits <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  if (product.stock_units < quantityUnits) {
    throw new Error("Insufficient stock.");
  }

  const unitCost = Number(product.cost_price_per_pack) / packSize;

  let unitPrice: number;
  if (saleType === "wholesale") {
    if (saleUnitType === "pack") {
      unitPrice = Number(product.wholesale_price_per_pack) / packSize;
    } else {
      const halfPrice =
        product.half_pack_price != null
          ? Number(product.half_pack_price)
          : Number(product.wholesale_price_per_pack) / 2;
      unitPrice = halfPrice / halfPackUnits;
    }
  } else if (saleType === "retail") {
    unitPrice = Number(product.retail_price_per_unit);
  } else {
    unitPrice = Number(product.store_price_per_unit);
  }

  const totalRevenue = unitPrice * quantityUnits;
  const profit = totalRevenue - unitCost * quantityUnits;
  const newStock = product.stock_units - quantityUnits;

  const { error: stockErr } = await db
    .from("products")
    .update({ stock_units: newStock, updated_at: new Date().toISOString() })
    .eq("id", productId);
  if (stockErr) throw new Error(stockErr.message);

  const { data: sale, error: saleErr } = await db
    .from("sales")
    .insert({
      product_id: productId,
      user_id: user.id,
      sale_type: saleType,
      sale_unit_type: saleUnitType,
      quantity_units: quantityUnits,
      unit_price: unitPrice,
      total_revenue: totalRevenue,
      unit_cost: unitCost,
      profit,
      pack_size_at_sale: packSize,
    })
    .select("id")
    .single();
  if (saleErr) throw new Error(saleErr.message);

  await db.from("audit_logs").insert({
    actor_id: user.id,
    action: "sale_recorded",
    entity_type: "sale",
    entity_id: sale.id,
    before: { stock_units: product.stock_units },
    after: {
      stock_units: newStock,
      product_id: productId,
      sale_type: saleType,
      sale_unit_type: saleUnitType,
      quantity_units: quantityUnits,
      total_revenue: totalRevenue,
    },
  });

  revalidatePath("/sales/sales/today");
  revalidatePath("/sales/products");
  revalidatePath("/admin/products");
}
