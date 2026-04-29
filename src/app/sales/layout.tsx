import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { getUserAndRole } from "@/lib/auth";

export default async function SalesLayout({ children }: { children: ReactNode }) {
  const { fullName, role } = await getUserAndRole();

  return (
    <AppShell
      brand="Prestige Drinks — Sales"
      subtitle={fullName}
      items={[
        { href: "/sales", label: "Dashboard" },
        { href: "/sales/products", label: "Available Goods" },
        { href: "/sales/goods-in", label: "Goods In" },
        { href: "/sales/sales/new", label: "Record a Sale" },
        { href: "/sales/sales/today", label: "Daily Sales" },
        { href: "/sales/reports", label: "Weekly Returns" },
        { href: "/sales/submit", label: "Submit Day" },
        ...(role === "admin" ? [{ href: "/admin", label: "Admin View" }] : []),
      ]}
    >
      {children}
    </AppShell>
  );
}
