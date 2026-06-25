import { getDomainLabel } from "@/lib/utils";
import type { ClipWithTags } from "@/types/clip";

export const CLIP_EXPORT_COLUMNS = [
  "title",
  "url",
  "domain",
  "memo",
  "body",
  "has_image",
  "created_at",
  "updated_at",
  "tags",
] as const;

type ClipExportColumn = (typeof CLIP_EXPORT_COLUMNS)[number];

export type ClipExportRow = Record<ClipExportColumn, string | null>;

function protectCsvFormulaValue(value: string) {
  return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
}

export function escapeCsvValue(value: string | null | undefined) {
  const normalized = protectCsvFormulaValue(value ?? "");
  return `"${normalized.replace(/"/g, "\"\"")}"`;
}

export function buildCsv(rows: ClipExportRow[]) {
  if (rows.length === 0) {
    return CLIP_EXPORT_COLUMNS.join(",");
  }

  const lines = [CLIP_EXPORT_COLUMNS.join(",")];

  for (const row of rows) {
    lines.push(CLIP_EXPORT_COLUMNS.map((column) => escapeCsvValue(row[column])).join(","));
  }

  return lines.join("\n");
}

export function buildClipExportRow(clip: ClipWithTags): ClipExportRow {
  return {
    body: clip.body,
    created_at: clip.created_at,
    domain: getDomainLabel(clip.url) ?? "",
    has_image: clip.image_path ? "true" : "false",
    memo: clip.memo,
    tags: clip.tags.map((tag) => tag.name).join(" | "),
    title: clip.title,
    updated_at: clip.updated_at,
    url: clip.url,
  };
}

export function buildClipExportPayload(clip: ClipWithTags) {
  return {
    ai_summary: clip.ai_summary,
    ai_summary_updated_at: clip.ai_summary_updated_at,
    body: clip.body,
    created_at: clip.created_at,
    has_image: Boolean(clip.image_path),
    id: clip.id,
    is_archived: clip.is_archived,
    is_favorite: clip.is_favorite,
    memo: clip.memo,
    tags: clip.tags.map((tag) => ({
      color: tag.color,
      id: tag.id,
      name: tag.name,
    })),
    title: clip.title,
    updated_at: clip.updated_at,
    url: clip.url,
  };
}
