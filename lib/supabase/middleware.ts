import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

const protectedPrefixes = ["/archive", "/calendar", "/clips", "/favorites", "/tags"];
const guestOnlyPrefixes = ["/login"];
const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function redirectNoStore(url: URL) {
  return NextResponse.redirect(url, {
    headers: noStoreHeaders,
  });
}

export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!hasSupabaseEnv()) {
    if (pathname === "/setup") {
      return NextResponse.next();
    }

    return redirectNoStore(new URL("/setup", request.url));
  }

  let response = NextResponse.next({
    request,
  });

  const { supabaseAnonKey, supabaseUrl } = getSupabaseEnv();
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, options, value }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedPath = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isGuestOnlyPath = guestOnlyPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!user && isProtectedPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return redirectNoStore(loginUrl);
  }

  if (user && (pathname === "/" || isGuestOnlyPath || pathname === "/setup")) {
    return redirectNoStore(new URL("/clips", request.url));
  }

  return response;
}
