import { formatISO, subDays } from "date-fns";

import { getSupabaseAdmin, requireRole } from "@/lib/db/server";
import { parseDateParam, parseSaleType, parseUuid, toIsoDate } from "@/lib/reports";

export default async function PrintReportPage({
  searchParams,
}: {
  searchParams?: Promise<{
    start?: string;
    end?: string;
    userId?: string;
    saleType?: string;
    productId?: string;
  }>;
}) {
  await requireRole("admin");
  const sp = searchParams ? await searchParams : undefined;

  const start = parseDateParam(sp?.start);
  const end = parseDateParam(sp?.end);
  const endDate = end ?? new Date();
  const startDate = start ?? subDays(endDate, 6);
  const userId = parseUuid(sp?.userId);
  const productId = parseUuid(sp?.productId);
  const saleType = parseSaleType(sp?.saleType);

  const startIso = new Date(toIsoDate(startDate) + "T00:00:00.000Z").toISOString();
  const endIso = new Date(toIsoDate(endDate) + "T23:59:59.999Z").toISOString();

  const db = getSupabaseAdmin();
  let query = db
    .from("sales")
    .select(
      "id,sold_at,sale_type,sale_unit_type,quantity_units,total_revenue,profit,product:products(name)",
    )
    .gte("sold_at", startIso)
    .lte("sold_at", endIso)
    .order("sold_at", { ascending: true });

  if (userId) query = query.eq("user_id", userId);
  if (productId) query = query.eq("product_id", productId);
  if (saleType) query = query.eq("sale_type", saleType);

  const { data: sales } = await query;

  const totals = (sales ?? []).reduce(
    (acc, sale) => {
      const s = sale as Record<string, unknown>;
      acc.revenue += Number(s.total_revenue ?? 0);
      acc.profit += Number(s.profit ?? 0);
      acc.units += Number(s.quantity_units ?? 0);
      return acc;
    },
    { revenue: 0, profit: 0, units: 0 },
  );

  return (
    <div className="mx-auto w-full max-w-3xl bg-white p-8 print:p-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Prestige Drinks</div>
          <div className="mt-1 text-sm text-zinc-600">
            Sales Report ({toIsoDate(startDate)} to {toIsoDate(endDate)})
          </div>
        </div>
        <div className="text-right text-sm text-zinc-600">
          Generated {new Date().toLocaleString()}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Card label="Revenue" value={`GHS ${totals.revenue.toFixed(2)}`} />
        <Card label="Profit" value={`GHS ${totals.profit.toFixed(2)}`} />
        <Card label="Units Sold" value={`${totals.units}`} />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-600">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Revenue</th>
              <th className="px-3 py-2">Profit</th>
            </tr>
          </thead>
          <tbody>
            {(sales ?? []).map((sale) => {
              const s = sale as Record<string, unknown>;
              const soldAt = new Date(String(s.sold_at));
              const productName = getProductName(s.product);
              return (
              <tr key={String(s.id)} className="border-t border-zinc-100">
                <td className="px-3 py-2">
                  {formatISO(soldAt, { representation: "date" })}
                </td>
                <td className="px-3 py-2 font-medium">{productName}</td>
                <td className="px-3 py-2">
                  {String(s.sale_type ?? "")} / {String(s.sale_unit_type ?? "")}
                </td>
                <td className="px-3 py-2">{Number(s.quantity_units ?? 0)}</td>
                <td className="px-3 py-2">GHS {Number(s.total_revenue).toFixed(2)}</td>
                <td className="px-3 py-2">GHS {Number(s.profit).toFixed(2)}</td>
              </tr>
              );
            })}
            {sales?.length ? null : (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-zinc-600">
                  No sales in this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-xs text-zinc-500">
        Tip: use your browser Print dialog to “Save as PDF”.
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="text-xs text-zinc-600">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function getProductName(product: unknown) {
  if (!product) return "Unknown";
  if (Array.isArray(product)) {
    const first = product[0] as Record<string, unknown> | undefined;
    return first?.name?.toString() ?? "Unknown";
  }
  return (product as Record<string, unknown>).name?.toString() ?? "Unknown";
}
