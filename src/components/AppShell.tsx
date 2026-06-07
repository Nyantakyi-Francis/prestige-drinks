"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { logoutAction } from "@/app/login/actions";

type NavIcon =
  | "dashboard"
  | "products"
  | "goods"
  | "sale"
  | "today"
  | "reports"
  | "submit"
  | "users"
  | "admin"
  | "home"
  | "sales"
  | "settings";

type NavItem = {
  href: string;
  label: string;
  icon?: NavIcon;
  primary?: boolean;
};

const iconMap: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  products: Package,
  goods: PackagePlus,
  sale: ShoppingCart,
  today: ClipboardList,
  reports: BarChart3,
  submit: CheckCircle2,
  users: Users,
  admin: Shield,
  home: Home,
  sales: Store,
  settings: Settings,
};

export function AppShell({
  brand,
  subtitle,
  items,
  children,
}: {
  brand: string;
  subtitle?: string | null;
  items: NavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activeHref = useMemo(() => {
    const match = items
      .filter((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match?.href ?? null;
  }, [items, pathname]);

  const primaryItems = items.filter((item) => item.primary !== false).slice(0, 5);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>

            <Link href="/" className="min-w-0">
              <div className="truncate text-base font-semibold tracking-tight">{brand}</div>
              {subtitle ? (
                <div className="truncate text-sm text-zinc-600">{subtitle}</div>
              ) : null}
            </Link>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 pb-24 pt-5 lg:grid-cols-[248px_1fr] lg:pb-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm">
            <div className="space-y-1">
              {items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={activeHref === item.href}
                />
              ))}
            </div>
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(24,24,27,0.08)] lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 py-2">
          {primaryItems.map((item) => (
            <BottomNavLink
              key={item.href}
              item={item}
              active={activeHref === item.href}
            />
          ))}
        </div>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/35"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-sm border-r border-zinc-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">{brand}</div>
                {subtitle ? <div className="truncate text-sm text-zinc-600">{subtitle}</div> : null}
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="mt-5 space-y-1">
              {items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={activeHref === item.href}
                  onClick={() => setOpen(false)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = iconMap[item.icon ?? "home"] ?? Boxes;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={[
        "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-zinc-950 text-white"
          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950",
      ].join(" ")}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function BottomNavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = iconMap[item.icon ?? "home"] ?? Boxes;
  return (
    <Link
      href={item.href}
      className={[
        "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-semibold leading-tight",
        active ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100",
      ].join(" ")}
    >
      <Icon className="h-5 w-5" aria-hidden />
      <span className="max-w-full truncate">{item.label}</span>
    </Link>
  );
}
