import { BarChart3, Package, ShoppingCart, Store, Users } from "lucide-react";

import { ActionLink, PageHeader, SectionCard } from "@/components/ui";

const tasks = [
  {
    href: "/admin/overview",
    title: "Check the business",
    desc: "Sales, profit, and stock alerts.",
    icon: BarChart3,
  },
  {
    href: "/admin/products",
    title: "Manage products",
    desc: "Prices, stock, and product status.",
    icon: Package,
  },
  {
    href: "/admin/users",
    title: "Manage staff",
    desc: "Roles, resets, and active accounts.",
    icon: Users,
  },
  {
    href: "/admin/reports",
    title: "Run reports",
    desc: "Filter sales and export when needed.",
    icon: ShoppingCart,
  },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Admin home"
        description="Start with the common admin jobs. Detailed tables are still available inside each section."
        actions={
          <ActionLink href="/sales" variant="secondary">
            <Store className="h-4 w-4" aria-hidden />
            Sales view
          </ActionLink>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <ActionLink key={task.href} href={task.href} variant="secondary">
              <span className="flex w-full items-center gap-3 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{task.title}</span>
                  <span className="block text-sm font-normal text-zinc-600">{task.desc}</span>
                </span>
              </span>
            </ActionLink>
          );
        })}
      </div>

      <SectionCard>
        <h2 className="text-base font-semibold text-zinc-950">Simple workflow</h2>
        <ol className="mt-3 grid gap-3 text-sm text-zinc-700 sm:grid-cols-3">
          <li className="rounded-md bg-zinc-50 p-3">
            <span className="font-semibold text-zinc-950">1. Check overview</span>
            <br />
            See sales and stock alerts first.
          </li>
          <li className="rounded-md bg-zinc-50 p-3">
            <span className="font-semibold text-zinc-950">2. Fix stock/products</span>
            <br />
            Update only what needs attention.
          </li>
          <li className="rounded-md bg-zinc-50 p-3">
            <span className="font-semibold text-zinc-950">3. Export reports</span>
            <br />
            Use filters only when you need detail.
          </li>
        </ol>
      </SectionCard>
    </div>
  );
}
