import { NextResponse } from "next/server";

import { getSupabaseAdmin, requireRole } from "@/lib/db/server";
import {
  csvEscape,
  parseDateParam,
  parseSaleType,
  parseUuid,
  toIsoDate,
} from "@/lib/reports";

export async function GET(request: Request) {
  await requireRole("admin");

  const url = new URL(request.url);
  const start = parseDateParam(url.searchParams.get("start"));
  const end = parseDateParam(url.searchParams.get("end"));
  const userId = parseUuid(url.searchParams.get("userId"));
  const productId = parseUuid(url.searchParams.get("productId"));
  const saleType = parseSaleType(url.searchParams.get("saleType"));
  const startDate = start ?? new Date(Date.now() - 6 * 24 * 3600 * 1000);
  const endDate = end ?? new Date();

  const startIso = new Date(toIsoDate(startDate) + "T00:00:00.000Z").toISOString();
  const endIso = new Date(toIsoDate(endDate) + "T23:59:59.999Z").toISOString();

  const db = getSupabaseAdmin();
  let query = db
    .from("sales")
    .select(
      "id,sold_at,sale_type,sale_unit_type,quantity_units,unit_price,total_revenue,profit,user_id,product:products(name)",
    )
    .gte("sold_at", startIso)
    .lte("sold_at", endIso)
    .order("sold_at", { ascending: true });

  if (userId) query = query.eq("user_id", userId);
  if (productId) query = query.eq("product_id", productId);
  if (saleType) query = query.eq("sale_type", saleType);

  const { data: sales, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = [
    "sold_at",
    "product",
    "sale_type",
    "sale_unit_type",
    "quantity_units",
    "unit_price",
    "total_revenue",
    "profit",
    "user_id",
    "sale_id",
  ];

  const lines = [
    header.join(","),
    ...(sales ?? []).map((sale) => {
      const s = sale as Record<string, unknown>;
      const productName = getProductName(s.product);
      return [
        s.sold_at,
        productName,
        s.sale_type,
        s.sale_unit_type,
        s.quantity_units,
        s.unit_price,
        s.total_revenue,
        s.profit,
        s.user_id,
        s.id,
      ]
        .map(csvEscape)
        .join(",");
    }),
  ];

  const body = lines.join("\n");
  const filename = `prestige-drinks-sales-${toIsoDate(startDate)}_to_${toIsoDate(endDate)}.csv`;

  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=\"${filename}\"`,
    },
  });
}

function getProductName(product: unknown) {
  if (!product) return "";
  if (Array.isArray(product)) {
    const first = product[0] as Record<string, unknown> | undefined;
    return first?.name?.toString() ?? "";
  }
  return (product as Record<string, unknown>).name?.toString() ?? "";
}
