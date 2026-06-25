import { NextResponse } from "next/server";
import { z } from "zod";

import { extractTitle, fetchPageHtml, getContentFetchErrorCode } from "@/lib/content-extractor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function jsonResponse(body: { error: string } | { title: string }, status = 200) {
  return NextResponse.json(body, { headers: noStoreHeaders, status });
}

const urlSchema = z.object({
  url: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) {
        return false;
      }

      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "有効なURLを入力してください。"),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse({ error: "ログインが必要です。" }, 401);
  }

  const requestUrl = new URL(request.url);
  const parsed = urlSchema.safeParse({
    url: requestUrl.searchParams.get("url"),
  });

  if (!parsed.success) {
    return jsonResponse({ error: "有効なURLを入力してください。" }, 400);
  }

  try {
    const html = await fetchPageHtml(parsed.data.url);
    const title = extractTitle(html);

    if (!title) {
      return jsonResponse({ error: "このページからタイトルを取得できませんでした。" }, 404);
    }

    return jsonResponse({ title });
  } catch (error) {
    const errorCode = getContentFetchErrorCode(error);

    if (errorCode === "INVALID_URL" || errorCode === "BLOCKED_URL") {
      return jsonResponse({ error: "このURLは取得できません。" }, 400);
    }

    console.error("[url-fetch-error]", {
      code: errorCode,
      route: "fetch-title",
    });

    return jsonResponse({ error: "ページタイトルの取得に失敗しました。" }, 502);
  }
}
