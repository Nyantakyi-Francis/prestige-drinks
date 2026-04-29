import Link from "next/link";

const tiles = [
  { href: "/sales/products", title: "Available Goods", desc: "View stock levels." },
  { href: "/sales/goods-in", title: "Goods In", desc: "Record incoming stock." },
  { href: "/sales/sales/new", title: "Record a Sale", desc: "Wholesale/Retail/Store." },
  { href: "/sales/sales/today", title: "Daily Sales", desc: "Today’s sales + totals." },
  { href: "/sales/reports", title: "Weekly Returns", desc: "Rolling 7-day view." },
  { href: "/sales/submit", title: "Submit Day", desc: "Lock today’s sales." },
];

export default function SalesHomePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Quick actions for your daily work.
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
