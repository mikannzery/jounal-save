import { NextResponse } from "next/server";
import { z } from "zod";

import { extractContent, fetchPageHtml, getContentFetchErrorCode } from "@/lib/content-extractor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

type FetchContentResponseBody = { error: string } | ReturnType<typeof extractContent>;

function jsonResponse(body: FetchContentResponseBody, status = 200) {
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
    const result = extractContent(html, parsed.data.url);

    return jsonResponse(result);
  } catch (error) {
    const errorCode = getContentFetchErrorCode(error);

    if (errorCode === "CONTENT_TOO_SHORT") {
      return jsonResponse({ error: "このページから記事本文を抽出できませんでした。" }, 422);
    }

    if (errorCode === "INVALID_URL" || errorCode === "BLOCKED_URL") {
      return jsonResponse({ error: "このURLは取得できません。" }, 400);
    }

    console.error("[url-fetch-error]", {
      code: errorCode,
      route: "fetch-content",
    });

    return jsonResponse({ error: "ページ本文の取得に失敗しました。" }, 502);
  }
}
