import { NextResponse } from "next/server";
import { z } from "zod";

import { createOrGetOwnedTag, DEFAULT_TAG_COLOR, tagColorSchema, tagNameSchema } from "@/lib/tags";
import { createClient } from "@/lib/supabase/server";

const createTagRequestSchema = z.object({
  color: tagColorSchema.optional().default(DEFAULT_TAG_COLOR),
  name: tagNameSchema,
});

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { headers: noStoreHeaders, status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse({ error: "ログインが必要です。" }, 401);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "リクエスト内容が正しくありません。" }, 400);
  }

  const parsed = createTagRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonResponse(
      { error: parsed.error.issues[0]?.message ?? "タグ情報が正しくありません。" },
      400,
    );
  }

  try {
    const result = await createOrGetOwnedTag(supabase, user.id, parsed.data);

    return jsonResponse({
      created: result.created,
      tag: {
        color: result.tag.color,
        id: result.tag.id,
        name: result.tag.name,
      },
    });
  } catch {
    return jsonResponse({ error: "タグの作成に失敗しました。" }, 500);
  }
}
