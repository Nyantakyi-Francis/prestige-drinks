"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/login/actions";

type NavItem = { href: string; label: string };

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
    const match = items.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
    return match?.href ?? null;
  }, [items, pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <span className="text-lg leading-none">☰</span>
            </button>

            <Link href="/" className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight">{brand}</div>
              {subtitle ? (
                <div className="truncate text-xs text-zinc-600">{subtitle}</div>
              ) : null}
            </Link>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 rounded-2xl border border-zinc-200/70 bg-white p-3 shadow-sm">
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-800 hover:bg-zinc-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            className="absolute inset-0 bg-black/30"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-xs border-r border-zinc-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{brand}</div>
              <button
                type="button"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            {subtitle ? <div className="mt-1 text-xs text-zinc-600">{subtitle}</div> : null}
            <div className="mt-4 space-y-1">
              {items.map((item) => {
                const isActive = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-800 hover:bg-zinc-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

