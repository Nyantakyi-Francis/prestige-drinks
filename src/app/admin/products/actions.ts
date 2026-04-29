"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseAdmin, requireRole } from "@/lib/db/server";

const CreateProductSchema = z.object({
  name: z.string().min(1),
  packSize: z.coerce.number().int().positive(),
  costPricePerPack: z.coerce.number().nonnegative(),
  wholesalePricePerPack: z.coerce.number().nonnegative(),
  halfPackPrice: z.coerce.number().nonnegative().optional(),
  retailPricePerUnit: z.coerce.number().nonnegative(),
  storePricePerUnit: z.coerce.number().nonnegative(),
  startingStockPacks: z.coerce.number().int().nonnegative().default(0),
  startingStockUnits: z.coerce.number().int().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(50),
});

export async function createProductAction(formData: FormData) {
  await requireRole("admin");
  const db = getSupabaseAdmin();

  const parsed = CreateProductSchema.safeParse({
    name: formData.get("name"),
    packSize: formData.get("packSize"),
    costPricePerPack: formData.get("costPricePerPack"),
    wholesalePricePerPack: formData.get("wholesalePricePerPack"),
    halfPackPrice: String(formData.get("halfPackPrice") ?? "").trim()
      ? formData.get("halfPackPrice")
      : undefined,
    retailPricePerUnit: formData.get("retailPricePerUnit"),
    storePricePerUnit: formData.get("storePricePerUnit"),
    startingStockPacks: formData.get("startingStockPacks"),
    startingStockUnits: formData.get("startingStockUnits"),
    lowStockThreshold: formData.get("lowStockThreshold"),
  });

  if (!parsed.success) {
    throw new Error("Invalid product input");
  }

  const v = parsed.data;
  const totalStartingUnits =
    v.startingStockPacks * v.packSize + v.startingStockUnits;
  const { error } = await db.from("products").insert({
    name: v.name,
    pack_size: v.packSize,
    cost_price_per_pack: v.costPricePerPack,
    wholesale_price_per_pack: v.wholesalePricePerPack,
    half_pack_price: v.halfPackPrice ?? null,
    retail_price_per_unit: v.retailPricePerUnit,
    store_price_per_unit: v.storePricePerUnit,
    stock_units: totalStartingUnits,
    stock_packs: Math.floor(totalStartingUnits / v.packSize),
    stock_pieces: totalStartingUnits % v.packSize,
    low_stock_threshold: v.lowStockThreshold,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
}

const UpdateProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  packSize: z.coerce.number().int().positive(),
  costPricePerPack: z.coerce.number().nonnegative(),
  wholesalePricePerPack: z.coerce.number().nonnegative(),
  halfPackPrice: z.coerce.number().nonnegative().optional(),
  retailPricePerUnit: z.coerce.number().nonnegative(),
  storePricePerUnit: z.coerce.number().nonnegative(),
  stockPacks: z.coerce.number().int().nonnegative().default(0),
  stockPieces: z.coerce.number().int().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(50),
  isActive: z.coerce.boolean().default(true),
});

export async function updateProductAction(formData: FormData) {
  await requireRole("admin");
  const db = getSupabaseAdmin();

  const parsed = UpdateProductSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    packSize: formData.get("packSize"),
    costPricePerPack: formData.get("costPricePerPack"),
    wholesalePricePerPack: formData.get("wholesalePricePerPack"),
    halfPackPrice: String(formData.get("halfPackPrice") ?? "").trim()
      ? formData.get("halfPackPrice")
      : undefined,
    retailPricePerUnit: formData.get("retailPricePerUnit"),
    storePricePerUnit: formData.get("storePricePerUnit"),
    stockPacks: formData.get("stockPacks"),
    stockPieces: formData.get("stockPieces"),
    lowStockThreshold: formData.get("lowStockThreshold"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    throw new Error("Invalid product update");
  }

  const v = parsed.data;
  const { error } = await db
    .from("products")
    .update({
      name: v.name,
      pack_size: v.packSize,
      cost_price_per_pack: v.costPricePerPack,
      wholesale_price_per_pack: v.wholesalePricePerPack,
      half_pack_price: v.halfPackPrice ?? null,
      retail_price_per_unit: v.retailPricePerUnit,
      store_price_per_unit: v.storePricePerUnit,
      stock_packs: v.stockPacks,
      stock_pieces: v.stockPieces,
      low_stock_threshold: v.lowStockThreshold,
      is_active: v.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", v.id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${v.id}`);
}

const DeleteProductSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteProductAction(formData: FormData) {
  await requireRole("admin");
  const db = getSupabaseAdmin();

  const parsed = DeleteProductSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) throw new Error("Invalid product id");

  const { error } = await db.from("products").delete().eq("id", parsed.data.id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
}

export async function deactivateProductAction(formData: FormData) {
  await requireRole("admin");
  const db = getSupabaseAdmin();

  const parsed = DeleteProductSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) throw new Error("Invalid product id");

  const { error } = await db
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}
