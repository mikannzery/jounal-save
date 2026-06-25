import { NextResponse } from "next/server";

import {
  getClipById,
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

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function exportError(message: string, status: number) {
  return NextResponse.json({ error: message }, { headers: noStoreHeaders, status });
}

function buildExportFilename(scope: string, format: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `clip-memo-${scope}-${stamp}.${format}`;
}

function sanitizeFilenameBase(value: string, fallback: string) {
  const sanitized = value
    .replace(/[\u0000-\u001F\u007F\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 80);

  return sanitized || fallback;
}

function encodeContentDispositionFilename(value: string) {
  return encodeURIComponent(value).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildAttachmentDisposition(filename: string) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]+/g, "-").replace(/"/g, "-") || "clip-memo-export";
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeContentDispositionFilename(filename)}`;
}

function buildClipExportFilename(title: string, format: string) {
  return `${sanitizeFilenameBase(title, "clip")}.${format}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const clipId = url.searchParams.get("id");
  const scope = url.searchParams.get("scope");
  const sort = resolveClipSort(url.searchParams.get("sort") ?? undefined);
  const tag = resolveTagFilter(url.searchParams.get("tag") ?? undefined);
  const monthFilter = resolveClipMonthFilter(
    url.searchParams.get("year") ?? undefined,
    url.searchParams.get("month") ?? undefined,
  );

  if ((format !== "json" && format !== "csv") || (scope !== "clips" && scope !== "favorites" && scope !== "archive" && scope !== "clip")) {
    return exportError("export の指定が正しくありません。", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return exportError("ログインが必要です。", 401);
  }

  try {
    if (scope === "clip") {
      if (!clipId) {
        return exportError("export の指定が正しくありません。", 400);
      }

      const clip = await getClipById(supabase, clipId, user.id);

      if (!clip) {
        return exportError("記事が見つかりませんでした。", 404);
      }

      if (format === "json") {
        return new NextResponse(JSON.stringify(buildClipExportPayload(clip), null, 2), {
          headers: {
            ...noStoreHeaders,
            "Content-Disposition": buildAttachmentDisposition(buildClipExportFilename(clip.title, "json")),
            "Content-Type": "application/json; charset=utf-8",
          },
        });
      }

      return new NextResponse(`\uFEFF${buildCsv([buildClipExportRow(clip)])}`, {
        headers: {
          ...noStoreHeaders,
          "Content-Disposition": buildAttachmentDisposition(buildClipExportFilename(clip.title, "csv")),
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

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
            ...noStoreHeaders,
            "Content-Disposition": buildAttachmentDisposition(buildExportFilename(scope, "json")),
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    }

    const csv = buildCsv(clips.map((clip) => buildClipExportRow(clip)));

    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        ...noStoreHeaders,
        "Content-Disposition": buildAttachmentDisposition(buildExportFilename(scope, "csv")),
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch {
    return exportError("export に失敗しました。時間をおいて再試行してください。", 500);
  }
}
