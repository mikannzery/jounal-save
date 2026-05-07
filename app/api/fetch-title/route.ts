import { NextResponse } from "next/server";
import { z } from "zod";

import { extractTitle, fetchPageHtml } from "@/lib/content-extractor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    }, "Enter a valid URL."),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const requestUrl = new URL(request.url);
  const parsed = urlSchema.safeParse({
    url: requestUrl.searchParams.get("url"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  }

  try {
    const html = await fetchPageHtml(parsed.data.url);
    const title = extractTitle(html);

    if (!title) {
      return NextResponse.json({ error: "No title was found on that page." }, { status: 404 });
    }

    return NextResponse.json({ title });
  } catch (error) {
    if (error instanceof Error && (error.message === "INVALID_URL" || error.message === "BLOCKED_URL")) {
      return NextResponse.json({ error: "This URL cannot be fetched." }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to fetch the page title." }, { status: 502 });
  }
}
