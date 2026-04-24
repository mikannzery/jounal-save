import { NextResponse } from "next/server";

import {
  listArchivedClips,
  listClips,
  listFavoriteClips,
  resolveClipMonthFilter,
  resolveClipSort,
  resolveTagFilter,
} from "@/lib/clips";
import { buildClipExportPayload, buildClipExportRow, buildCsv } from "@/lib/clip-export";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function buildExportFilename(scope: string, format: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `clip-memo-${scope}-${stamp}.${format}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const scope = url.searchParams.get("scope");
  const sort = resolveClipSort(url.searchParams.get("sort") ?? undefined);
  const tag = resolveTagFilter(url.searchParams.get("tag") ?? undefined);
  const monthFilter = resolveClipMonthFilter(
    url.searchParams.get("year") ?? undefined,
    url.searchParams.get("month") ?? undefined,
  );

  if ((format !== "json" && format !== "csv") || (scope !== "clips" && scope !== "favorites" && scope !== "archive")) {
    return NextResponse.json({ error: "Invalid export parameters." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const clips =
      scope === "favorites"
        ? await listFavoriteClips(supabase, user.id, sort, tag, monthFilter)
        : scope === "archive"
          ? await listArchivedClips(supabase, user.id, sort, tag, monthFilter)
          : await listClips(supabase, user.id, sort, tag, monthFilter);

    if (format === "json") {
      return new NextResponse(
        JSON.stringify(
          {
            filters: {
              scope,
              sort,
              tag: tag ?? null,
              month: monthFilter?.month ?? null,
              year: monthFilter?.year ?? null,
            },
            exportedAt: new Date().toISOString(),
            items: clips.map((clip) => buildClipExportPayload(clip)),
          },
          null,
          2,
        ),
        {
          headers: {
            "Content-Disposition": `attachment; filename="${buildExportFilename(scope, "json")}"`,
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    }

    const csv = buildCsv(clips.map((clip) => buildClipExportRow(clip)));

    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Disposition": `attachment; filename="${buildExportFilename(scope, "csv")}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export clips." }, { status: 500 });
  }
}
