import type { SupabaseClient } from "@supabase/supabase-js";

import type { ClipRow, ClipTagSummary, ClipWithTags, TagSummary } from "@/types/clip";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;
type SupabaseErrorLike = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
};

export type ClipSort =
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "updated_asc"
  | "title_asc"
  | "title_desc";
export type ClipView = "grid" | "list";
export type ClipMonthFilter = { month: number; year: number };

const minClipArchiveYear = 2000;
const maxClipArchiveYear = 9999;

export const clipSortOptions: Array<{ label: string; value: ClipSort }> = [
  { label: "作成日 新しい順", value: "created_desc" },
  { label: "作成日 古い順", value: "created_asc" },
  { label: "更新日 新しい順", value: "updated_desc" },
  { label: "更新日 古い順", value: "updated_asc" },
  { label: "タイトル 昇順", value: "title_asc" },
  { label: "タイトル 降順", value: "title_desc" },
];

function logClipDataError(stage: string, error: SupabaseErrorLike | null | undefined) {
  console.error("[clips-error]", {
    error: error
      ? {
          code: error.code ?? null,
          details: error.details ?? null,
          hint: error.hint ?? null,
          message: error.message ?? null,
        }
      : null,
    stage,
  });
}

function applySort<TQuery extends { order: (column: string, options: { ascending: boolean }) => TQuery }>(
  query: TQuery,
  sort: ClipSort,
) {
  switch (sort) {
    case "created_asc":
      return query.order("created_at", { ascending: true });
    case "updated_desc":
      return query.order("updated_at", { ascending: false });
    case "updated_asc":
      return query.order("updated_at", { ascending: true });
    case "title_asc":
      return query.order("title", { ascending: true });
    case "title_desc":
      return query.order("title", { ascending: false });
    case "created_desc":
    default:
      return query.order("created_at", { ascending: false });
  }
}

async function listClipTagsForClips(
  supabase: TypedSupabaseClient,
  clipIds: string[],
) {
  if (clipIds.length === 0) {
    return [] satisfies ClipTagSummary[];
  }

  const { data, error } = await supabase
    .from("clip_tags")
    .select("clip_id,tag_id")
    .in("clip_id", clipIds);

  if (error) {
    logClipDataError("list-clip-tags", error);
    throw new Error("Failed to load clip tags.");
  }

  return data;
}

async function listTagsByIds(
  supabase: TypedSupabaseClient,
  userId: string,
  tagIds: string[],
) {
  if (tagIds.length === 0) {
    return [] satisfies TagSummary[];
  }

  const { data, error } = await supabase
    .from("tags")
    .select("id,name,color")
    .eq("user_id", userId)
    .in("id", tagIds);

  if (error) {
    logClipDataError("list-tags-by-ids", error);
    throw new Error("Failed to load tags.");
  }

  return data;
}

async function attachTags(
  supabase: TypedSupabaseClient,
  userId: string,
  clips: ClipRow[],
): Promise<ClipWithTags[]> {
  const clipTags = await listClipTagsForClips(
    supabase,
    clips.map((clip) => clip.id),
  );
  const tags = await listTagsByIds(
    supabase,
    userId,
    [...new Set(clipTags.map((clipTag) => clipTag.tag_id))],
  );

  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const tagIdsByClipId = new Map<string, string[]>();

  for (const clipTag of clipTags) {
    const current = tagIdsByClipId.get(clipTag.clip_id) ?? [];
    current.push(clipTag.tag_id);
    tagIdsByClipId.set(clipTag.clip_id, current);
  }

  return clips.map((clip) => ({
    ...clip,
    tags: (tagIdsByClipId.get(clip.id) ?? [])
      .map((tagId) => tagsById.get(tagId))
      .filter((tag): tag is TagSummary => Boolean(tag)),
  }));
}

async function resolveTagClipIds(
  supabase: TypedSupabaseClient,
  userId: string,
  tagName?: string,
) {
  if (!tagName) {
    return null;
  }

  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .select("id")
    .eq("user_id", userId)
    .eq("name", tagName)
    .maybeSingle();

  if (tagError) {
    logClipDataError("resolve-tag-filter:tag", tagError);
    throw new Error("Failed to resolve tag filter.");
  }

  if (!tag) {
    return [] as string[];
  }

  const { data: clipTags, error: clipTagError } = await supabase
    .from("clip_tags")
    .select("clip_id")
    .eq("tag_id", tag.id);

  if (clipTagError) {
    logClipDataError("resolve-tag-filter:clip-tags", clipTagError);
    throw new Error("Failed to resolve tag filter.");
  }

  return clipTags.map((item) => item.clip_id);
}

async function listClipsByScope(
  supabase: TypedSupabaseClient,
  userId: string,
  scope: "active" | "archived" | "favorite",
  sort: ClipSort,
  tagName?: string,
  monthFilter?: ClipMonthFilter,
) {
  const clipIds = await resolveTagClipIds(supabase, userId, tagName);

  if (clipIds && clipIds.length === 0) {
    return [] satisfies ClipWithTags[];
  }

  let query = supabase.from("clips").select("*").eq("user_id", userId);

  if (scope === "active") {
    query = query.eq("is_archived", false);
  }

  if (scope === "archived") {
    query = query.eq("is_archived", true);
  }

  if (scope === "favorite") {
    query = query.eq("is_archived", false).eq("is_favorite", true);
  }

  if (clipIds) {
    query = query.in("id", clipIds);
  }

  if (monthFilter) {
    const rangeStart = new Date(monthFilter.year, monthFilter.month - 1, 1).toISOString();
    const rangeEnd = new Date(monthFilter.year, monthFilter.month, 1).toISOString();
    query = query.gte("created_at", rangeStart).lt("created_at", rangeEnd);
  }

  const { data, error } = await applySort(query, sort);

  if (error) {
    logClipDataError("list-clips", error);
    throw new Error("Failed to load clips.");
  }

  return attachTags(supabase, userId, data);
}

export function resolveClipSort(value: string | string[] | undefined): ClipSort {
  const normalized = Array.isArray(value) ? value[0] : value;

  if (
    normalized === "created_asc" ||
    normalized === "updated_desc" ||
    normalized === "updated_asc" ||
    normalized === "title_asc" ||
    normalized === "title_desc"
  ) {
    return normalized;
  }

  return "created_desc";
}

export function resolveClipView(value: string | string[] | undefined): ClipView {
  const normalized = Array.isArray(value) ? value[0] : value;
  return normalized === "list" ? "list" : "grid";
}

export function resolveTagFilter(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;
  return normalized?.trim() ? normalized.trim() : undefined;
}

export function resolveClipMonthFilter(
  rawYear: string | string[] | undefined,
  rawMonth: string | string[] | undefined,
) {
  const year = resolveCalendarYear(rawYear);
  const month = Number(Array.isArray(rawMonth) ? rawMonth[0] : rawMonth);

  if (
    year !== undefined &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  ) {
    return { month, year } satisfies ClipMonthFilter;
  }

  return undefined;
}

export function resolveCalendarYear(value: string | string[] | undefined, fallbackYear?: number) {
  const year = Number(Array.isArray(value) ? value[0] : value);

  if (Number.isInteger(year) && year >= minClipArchiveYear && year <= maxClipArchiveYear) {
    return year;
  }

  if (
    fallbackYear !== undefined &&
    Number.isInteger(fallbackYear) &&
    fallbackYear >= minClipArchiveYear &&
    fallbackYear <= maxClipArchiveYear
  ) {
    return fallbackYear;
  }

  return undefined;
}

export function resolveSelectionMode(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;
  return normalized === "on";
}

export function buildClipBrowseHref(
  basePath: string,
  options: {
    month?: number;
    select?: boolean;
    sort: ClipSort;
    tag?: string;
    view: ClipView;
    year?: number;
  },
) {
  const params = new URLSearchParams();
  params.set("sort", options.sort);
  params.set("view", options.view);

  if (options.tag) {
    params.set("tag", options.tag);
  }

  if (options.select) {
    params.set("select", "on");
  }

  if (options.year && options.month) {
    params.set("year", String(options.year));
    params.set("month", String(options.month));
  }

  return `${basePath}?${params.toString()}`;
}

export function buildExportHref(options: {
  format: "csv" | "json";
  month?: number;
  scope: "archive" | "clips" | "favorites";
  sort: ClipSort;
  tag?: string;
  year?: number;
}) {
  const params = new URLSearchParams();
  params.set("format", options.format);
  params.set("scope", options.scope);
  params.set("sort", options.sort);

  if (options.tag) {
    params.set("tag", options.tag);
  }

  if (options.year && options.month) {
    params.set("year", String(options.year));
    params.set("month", String(options.month));
  }

  return `/api/export?${params.toString()}`;
}

export async function listClips(
  supabase: TypedSupabaseClient,
  userId: string,
  sort: ClipSort = "created_desc",
  tagName?: string,
  monthFilter?: ClipMonthFilter,
) {
  return listClipsByScope(supabase, userId, "active", sort, tagName, monthFilter);
}

export async function listArchivedClips(
  supabase: TypedSupabaseClient,
  userId: string,
  sort: ClipSort = "updated_desc",
  tagName?: string,
  monthFilter?: ClipMonthFilter,
) {
  return listClipsByScope(supabase, userId, "archived", sort, tagName, monthFilter);
}

export async function listFavoriteClips(
  supabase: TypedSupabaseClient,
  userId: string,
  sort: ClipSort = "updated_desc",
  tagName?: string,
  monthFilter?: ClipMonthFilter,
) {
  return listClipsByScope(supabase, userId, "favorite", sort, tagName, monthFilter);
}

export async function listClipMonthCountsForUser(
  supabase: TypedSupabaseClient,
  userId: string,
  year: number,
) {
  const rangeStart = new Date(year, 0, 1).toISOString();
  const rangeEnd = new Date(year + 1, 0, 1).toISOString();
  const { data, error } = await supabase
    .from("clips")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", rangeStart)
    .lt("created_at", rangeEnd);

  if (error) {
    logClipDataError("list-month-counts", error);
    throw new Error("Failed to load clip month counts.");
  }

  const monthlyCounts = Array.from({ length: 12 }, () => 0);

  for (const clip of data) {
    const monthIndex = new Date(clip.created_at).getMonth();
    monthlyCounts[monthIndex] += 1;
  }

  return monthlyCounts;
}

export async function getClipById(
  supabase: TypedSupabaseClient,
  clipId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("clips")
    .select("*")
    .eq("id", clipId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logClipDataError("detail-load", error);
    throw new Error("Failed to load clip.");
  }

  if (!data) {
    return null;
  }

  const [clip] = await attachTags(supabase, userId, [data]);
  return clip;
}
