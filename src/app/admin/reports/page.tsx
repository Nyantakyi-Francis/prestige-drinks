import Link from "next/link";
import { Download, FileText, Filter } from "lucide-react";
import { formatISO, subDays } from "date-fns";

import {
  ActionLink,
  EmptyState,
  MetricTile,
  PageHeader,
  PrimaryButton,
  SectionCard,
  StatusBadge,
  inputClassName,
} from "@/components/ui";
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

  const queryParams = {
    start: toIsoDate(start),
    end: toIsoDate(end),
    userId,
    saleType,
    productId,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Start with totals. Use filters only when you need a narrower view."
        actions={
          <>
            <ActionLink href={`/admin/reports/export/csv${buildQueryString(queryParams)}`} variant="secondary">
              <Download className="h-4 w-4" aria-hidden />
              CSV
            </ActionLink>
            <ActionLink
              href={`/admin/reports/print${buildQueryString(queryParams)}`}
              target="_blank"
            >
              <FileText className="h-4 w-4" aria-hidden />
              Print
            </ActionLink>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile label="Revenue" value={`GHS ${totals.revenue.toFixed(2)}`} helper="Selected range" />
        <MetricTile label="Profit" value={`GHS ${totals.profit.toFixed(2)}`} helper="Selected range" />
        <MetricTile label="Units sold" value={`${totals.units}`} helper="Selected range" />
      </div>

      <SectionCard>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-zinc-600" aria-hidden />
          <h2 className="text-base font-semibold text-zinc-950">Filters</h2>
        </div>
        <form method="get" className="mt-4 grid gap-3 md:grid-cols-4">
          <Field label="Start date" name="start" type="date" defaultValue={toIsoDate(start)} />
          <Field label="End date" name="end" type="date" defaultValue={toIsoDate(end)} />
          <label className="block">
            <span className="text-sm font-semibold text-zinc-900">Salesperson</span>
            <select id="userId" name="userId" defaultValue={userId ?? ""} className={inputClassName("mt-2")}>
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
                      {String(p.full_name ?? p.id)}
                      {p.is_active === false ? " (disabled)" : ""}
                    </option>
                  );
                })}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-zinc-900">Sale type</span>
            <select id="saleType" name="saleType" defaultValue={saleType ?? ""} className={inputClassName("mt-2")}>
              <option value="">All</option>
              <option value="wholesale">Wholesale</option>
              <option value="retail">Retail</option>
              <option value="store">Store</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-zinc-900">Product</span>
            <select id="productId" name="productId" defaultValue={productId ?? ""} className={inputClassName("mt-2")}>
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
          </label>
          <div className="flex items-end gap-2 md:col-span-2">
            <PrimaryButton type="submit">Apply filters</PrimaryButton>
            <Link
              href="/admin/reports"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Reset
            </Link>
          </div>
        </form>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-950">Sales found</h2>
          <StatusBadge tone={(sales ?? []).length ? "info" : "neutral"}>
            {(sales ?? []).length} records
          </StatusBadge>
        </div>

        {(sales ?? []).length ? (
          <>
            <div className="mt-3 grid gap-3 lg:hidden">
              {(sales ?? []).map((sale) => {
                const s = sale as Record<string, unknown>;
                const soldAt = new Date(String(s.sold_at));
                return (
                  <div key={String(s.id)} className="rounded-md border border-zinc-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-zinc-950">
                          {getProductName(s.product)}
                        </div>
                        <div className="mt-1 text-sm text-zinc-600">
                          {formatISO(soldAt, { representation: "date" })} - {String(s.sale_type)} / {String(s.sale_unit_type)}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-semibold">GHS {Number(s.total_revenue).toFixed(2)}</div>
                        <div className="text-sm text-zinc-600">Profit GHS {Number(s.profit).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 hidden overflow-x-auto lg:block">
              <table className="min-w-max w-full text-sm">
                <thead className="bg-zinc-50 text-left text-zinc-600">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {(sales ?? []).map((sale) => {
                    const s = sale as Record<string, unknown>;
                    const soldAt = new Date(String(s.sold_at));
                    return (
                      <tr key={String(s.id)} className="border-t border-zinc-100">
                        <td className="px-4 py-3">{formatISO(soldAt, { representation: "date" })}</td>
                        <td className="px-4 py-3 font-semibold">{getProductName(s.product)}</td>
                        <td className="px-4 py-3">{String(s.sale_type)} / {String(s.sale_unit_type)}</td>
                        <td className="px-4 py-3">{Number(s.quantity_units ?? 0)}</td>
                        <td className="px-4 py-3">GHS {Number(s.total_revenue).toFixed(2)}</td>
                        <td className="px-4 py-3">GHS {Number(s.profit).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="mt-3">
            <EmptyState title="No sales found" body="Change the filters or reset to see more records." />
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  defaultValue,
}: {
  label: string;
  name: string;
  type: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
      <input id={name} name={name} type={type} defaultValue={defaultValue} className={inputClassName("mt-2")} />
    </label>
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
