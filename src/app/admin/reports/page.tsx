import Link from "next/link";
import { formatISO, subDays } from "date-fns";

import { getSupabaseAdmin, requireRole } from "@/lib/db/server";
import {
  buildQueryString,
  parseDateParam,
  parseSaleType,
  parseUuid,
  toIsoDate,
} from "@/lib/reports";

export default async function AdminReportsPage({
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
  const db = getSupabaseAdmin();

  const sp = searchParams ? await searchParams : undefined;
  const end = parseDateParam(sp?.end) ?? new Date();
  const start = parseDateParam(sp?.start) ?? subDays(end, 6);
  const userId = parseUuid(sp?.userId);
  const productId = parseUuid(sp?.productId);
  const saleType = parseSaleType(sp?.saleType);

  const startIso = new Date(toIsoDate(start) + "T00:00:00.000Z").toISOString();
  const endIso = new Date(toIsoDate(end) + "T23:59:59.999Z").toISOString();

  let query = db
    .from("sales")
    .select(
      "id,sold_at,sale_type,sale_unit_type,quantity_units,total_revenue,profit,product:products(name)",
    )
    .gte("sold_at", startIso)
    .lte("sold_at", endIso)
    .order("sold_at", { ascending: false });

  if (userId) query = query.eq("user_id", userId);
  if (productId) query = query.eq("product_id", productId);
  if (saleType) query = query.eq("sale_type", saleType);

  const { data: sales } = await query.limit(200);

  const [{ data: products }, { data: people }] = await Promise.all([
    db.from("products").select("id,name").order("name"),
    db
      .from("profiles")
      .select("id,full_name,role,is_active")
      .order("full_name", { ascending: true }),
  ]);

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Filter by date range, salesperson, sale type, and product.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
            href={`/admin/reports/export/csv${buildQueryString({
              start: toIsoDate(start),
              end: toIsoDate(end),
              userId,
              saleType,
              productId,
            })}`}
          >
            Export CSV
          </Link>
          <Link
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-800"
            href={`/admin/reports/print${buildQueryString({
              start: toIsoDate(start),
              end: toIsoDate(end),
              userId,
              saleType,
              productId,
            })}`}
            target="_blank"
          >
            Print / Save PDF
          </Link>
        </div>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70 md:grid-cols-4"
      >
        <div className="md:col-span-4 text-sm font-semibold">Filters</div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700" htmlFor="start">
            Start date
          </label>
          <input
            id="start"
            name="start"
            type="date"
            defaultValue={toIsoDate(start)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700" htmlFor="end">
            End date
          </label>
          <input
            id="end"
            name="end"
            type="date"
            defaultValue={toIsoDate(end)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700" htmlFor="userId">
            Salesperson
          </label>
          <select
            id="userId"
            name="userId"
            defaultValue={userId ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            <option value="">All</option>
            {(people ?? [])
              .filter((person) => {
                const p = person as Record<string, unknown>;
                return p.role === "salesperson" || p.role === "admin";
              })
              .map((person) => {
                const p = person as Record<string, unknown>;
                return (
                  <option key={String(p.id)} value={String(p.id)}>
                    {String(p.full_name ?? p.id)}{" "}
                    {p.is_active === false ? "(disabled)" : ""}
                  </option>
                );
              })}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700" htmlFor="saleType">
            Sale type
          </label>
          <select
            id="saleType"
            name="saleType"
            defaultValue={saleType ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            <option value="">All</option>
            <option value="wholesale">Wholesale</option>
            <option value="retail">Retail</option>
            <option value="store">Store</option>
          </select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium text-zinc-700" htmlFor="productId">
            Product
          </label>
          <select
            id="productId"
            name="productId"
            defaultValue={productId ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            <option value="">All</option>
            {(products ?? []).map((product) => {
              const p = product as Record<string, unknown>;
              return (
                <option key={String(p.id)} value={String(p.id)}>
                  {String(p.name ?? "")}
                </option>
              );
            })}
          </select>
        </div>
        <div className="flex items-end gap-2 md:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            Apply
          </button>
          <Link
            href="/admin/reports"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card label="Revenue" value={`GHS ${totals.revenue.toFixed(2)}`} />
        <Card label="Profit" value={`GHS ${totals.profit.toFixed(2)}`} />
        <Card label="Units Sold" value={`${totals.units}`} />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70">
        <div className="border-b border-zinc-200/70 px-4 py-3">
          <div className="text-sm font-semibold">Recent Sales</div>
          <div className="mt-1 text-xs text-zinc-500">Showing up to 200 records.</div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-600">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2">Revenue</th>
              <th className="px-4 py-2">Profit</th>
            </tr>
          </thead>
          <tbody>
            {(sales ?? []).map((sale) => {
              const s = sale as Record<string, unknown>;
              const soldAt = new Date(String(s.sold_at));
              const product = s.product as unknown;
              const productName = getProductName(product);
              return (
              <tr key={String(s.id)} className="border-t border-zinc-100">
                <td className="px-4 py-2">
                  {formatISO(soldAt, { representation: "date" })}
                </td>
                <td className="px-4 py-2 font-medium">{productName}</td>
                <td className="px-4 py-2">
                  {String(s.sale_type ?? "")} / {String(s.sale_unit_type ?? "")}
                </td>
                <td className="px-4 py-2">{Number(s.quantity_units ?? 0)}</td>
                <td className="px-4 py-2">GHS {Number(s.total_revenue).toFixed(2)}</td>
                <td className="px-4 py-2">GHS {Number(s.profit).toFixed(2)}</td>
              </tr>
              );
            })}
            {sales?.length ? null : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-600">
                  No sales found for these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
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
