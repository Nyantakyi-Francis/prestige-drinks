export function csvEscape(value: unknown) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function parseDateParam(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export type ReportSaleType = "wholesale" | "retail" | "store";

export function parseSaleType(value: string | null | undefined): ReportSaleType | null {
  if (value === "wholesale" || value === "retail" || value === "store") return value;
  return null;
}

export function parseUuid(value: string | null | undefined) {
  if (!value) return null;
  const v = value.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))
    return null;
  return v;
}

export function buildQueryString(params: Record<string, string | null | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
