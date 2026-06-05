import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { getUserAndRole } from "@/lib/auth";

export default async function SalesLayout({ children }: { children: ReactNode }) {
  const { fullName, role } = await getUserAndRole();

  return (
    <AppShell
      brand="Prestige Drinks"
      subtitle={fullName ? `Sales - ${fullName}` : "Sales workspace"}
      items={[
        { href: "/sales", label: "Today", icon: "dashboard" },
        { href: "/sales/sales/new", label: "Sell", icon: "sale" },
        { href: "/sales/goods-in", label: "Goods In", icon: "goods" },
        { href: "/sales/products", label: "Stock", icon: "products" },
        { href: "/sales/submit", label: "Submit", icon: "submit" },
        { href: "/sales/sales/today", label: "Sales List", icon: "today", primary: false },
        { href: "/sales/reports", label: "Weekly Returns", icon: "reports", primary: false },
        ...(role === "admin"
          ? [{ href: "/admin", label: "Admin View", icon: "admin" as const, primary: false }]
          : []),
      ]}
    >
      {children}
    </AppShell>
  );
}
