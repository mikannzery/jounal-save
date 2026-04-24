import { NextResponse } from "next/server";
import { z } from "zod";

import { createOrGetOwnedTag, DEFAULT_TAG_COLOR, tagColorSchema, tagNameSchema } from "@/lib/tags";
import { createClient } from "@/lib/supabase/server";

const createTagRequestSchema = z.object({
  color: tagColorSchema.optional().default(DEFAULT_TAG_COLOR),
  name: tagNameSchema,
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createTagRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid tag data." },
      { status: 400 },
    );
  }

  try {
    const result = await createOrGetOwnedTag(supabase, user.id, parsed.data);

    return NextResponse.json({
      created: result.created,
      tag: result.tag,
    });
  } catch {
    return NextResponse.json({ error: "Failed to create the tag." }, { status: 500 });
  }
}
