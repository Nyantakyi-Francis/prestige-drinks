import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Tone = "neutral" | "good" | "warn" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "border-zinc-200 bg-white text-zinc-800",
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-zinc-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

export function MetricTile({
  label,
  value,
  helper,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium opacity-80">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
        </div>
        {icon ? <div className="shrink-0 opacity-80">{icon}</div> : null}
      </div>
      {helper ? <div className="mt-2 text-sm opacity-80">{helper}</div> : null}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function FeedbackBanner({
  title,
  body,
  tone = "good",
}: {
  title: string;
  body?: string;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-lg border p-3 ${toneClasses[tone]}`} role="status">
      <div className="text-sm font-semibold">{title}</div>
      {body ? <div className="mt-1 text-sm opacity-85">{body}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center">
      <div className="text-sm font-semibold text-zinc-950">{title}</div>
      {body ? <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-600">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ActionLink({
  href,
  children,
  variant = "primary",
  ...props
}: ComponentPropsWithoutRef<typeof Link> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const cls =
    variant === "primary"
      ? "bg-zinc-950 text-white hover:bg-zinc-800"
      : variant === "danger"
        ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
        : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm ${cls}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function PrimaryButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const cls =
    variant === "primary"
      ? "bg-zinc-950 text-white hover:bg-zinc-800 disabled:bg-zinc-300"
      : variant === "danger"
        ? "border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:text-red-300"
        : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 disabled:text-zinc-400";

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed ${cls} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function inputClassName(extra = "") {
  return `min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:bg-zinc-100 sm:text-sm ${extra}`;
}

export function ProductStockSummary({
  stockUnits,
  packSize,
}: {
  stockUnits: number;
  packSize: number;
}) {
  const safeStock = Number.isFinite(stockUnits) ? Math.max(0, stockUnits) : 0;
  const safePack = Number.isFinite(packSize) ? Math.max(0, packSize) : 0;
  if (safePack <= 0) return <>{safeStock} units</>;

  const packs = Math.floor(safeStock / safePack);
  const units = safeStock % safePack;
  return (
    <>
      {packs} packs, {units} units{" "}
      <span className="text-zinc-500">({safeStock} units)</span>
    </>
  );
}
