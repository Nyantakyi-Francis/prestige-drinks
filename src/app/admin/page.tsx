import Link from "next/link";

const tiles = [
  { href: "/admin/overview", title: "Dashboard", desc: "Sales + profit summary." },
  { href: "/admin/products", title: "Products", desc: "Add/edit products & stock." },
  { href: "/admin/users", title: "Users", desc: "Create/manage salespersons." },
  { href: "/admin/reports", title: "Reports", desc: "Export PDF & CSV." },
  { href: "/sales", title: "Sales View", desc: "See salesperson pages." },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Manage products, pricing, and reporting.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-sm font-semibold">{t.title}</div>
            <div className="mt-1 text-xs text-zinc-600">{t.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
