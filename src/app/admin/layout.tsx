import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { getUserAndRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { fullName } = await getUserAndRole();

  return (
    <AppShell
      brand="Prestige Drinks"
      subtitle={fullName ? `Admin - ${fullName}` : "Admin workspace"}
      items={[
        { href: "/admin", label: "Home", icon: "home" },
        { href: "/admin/overview", label: "Overview", icon: "dashboard" },
        { href: "/admin/products", label: "Products", icon: "products" },
        { href: "/admin/users", label: "Users", icon: "users" },
        { href: "/admin/reports", label: "Reports", icon: "reports" },
        { href: "/sales", label: "Sales View", icon: "sales", primary: false },
      ]}
    >
      {children}
    </AppShell>
  );
}
