import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { getUserAndRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { fullName } = await getUserAndRole();

  return (
    <AppShell
      brand="Prestige Drinks — Admin"
      subtitle={fullName}
      items={[
        { href: "/admin", label: "Home" },
        { href: "/admin/overview", label: "Overview" },
        { href: "/admin/products", label: "Products" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/reports", label: "Reports" },
        { href: "/sales", label: "Sales View" },
      ]}
    >
      {children}
    </AppShell>
  );
}
