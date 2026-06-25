import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function redirectNoStore(url: URL) {
  return NextResponse.redirect(url, {
    headers: noStoreHeaders,
  });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const loginUrl = new URL("/login", requestUrl.origin);

  loginUrl.searchParams.set("error", "callback");

  if (!code) {
    return redirectNoStore(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth-callback-error]", {
      code: error.code ?? null,
      message: error.message ?? null,
      name: error.name ?? null,
      status: error.status ?? null,
    });

    return redirectNoStore(loginUrl);
  }

  return redirectNoStore(new URL("/clips", requestUrl.origin));
}
