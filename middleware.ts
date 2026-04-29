import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { normalizeSupabaseUrl } from "@/lib/env";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/auth",
  "/_next",
  "/favicon.ico",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const response = NextResponse.next();

  const supabase = createServerClient(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role as "admin" | "salesperson" | undefined;
  const isActive = (profile as Record<string, unknown> | null | undefined)?.is_active as
    | boolean
    | undefined;

  if (isActive === false) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "disabled");
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/sales";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/sales") && role === "admin") return response;
  if (pathname.startsWith("/sales") && role !== "salesperson") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|ico)$).*)"],
};
