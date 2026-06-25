import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { TagSummary } from "@/types/clip";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;
type SupabaseErrorLike = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
};

export const DEFAULT_TAG_COLOR = "#111111";
export const tagNameSchema = z.string().trim().min(1, "タグ名を入力してください。").max(40, "タグ名は40文字以内で入力してください。");
export const tagColorSchema = z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "有効な色を選択してください。");

export interface TagWithCount extends TagSummary {
  usageCount: number;
}

export function normalizeTagName(name: string) {
  return name.trim();
}

export function normalizeTagColor(color?: string | null) {
  const candidate = (color ?? DEFAULT_TAG_COLOR).trim();
  return tagColorSchema.safeParse(candidate).success ? candidate : DEFAULT_TAG_COLOR;
}

function normalizeTagIdentity(name: string) {
  return normalizeTagName(name).toLocaleLowerCase("ja-JP");
}

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505";
}

function logTagDataError(stage: string, error: SupabaseErrorLike | null | undefined) {
  console.error("[tags-error]", {
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

export async function listTagsForUser(supabase: TypedSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("tags")
    .select("id,name,color")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    logTagDataError("list-tags", error);
    throw new Error("Failed to load tags.");
  }

  return data;
}

export async function listTagsWithUsage(supabase: TypedSupabaseClient, userId: string): Promise<TagWithCount[]> {
  const tags = await listTagsForUser(supabase, userId);

  if (tags.length === 0) {
    return [];
  }

  const { data: clipTags, error } = await supabase.from("clip_tags").select("tag_id").in(
    "tag_id",
    tags.map((tag) => tag.id),
  );

  if (error) {
    logTagDataError("list-tag-usage", error);
    throw new Error("Failed to load tag usage.");
  }

  const counts = new Map<string, number>();

  for (const clipTag of clipTags) {
    counts.set(clipTag.tag_id, (counts.get(clipTag.tag_id) ?? 0) + 1);
  }

  return tags.map((tag) => ({
    ...tag,
    usageCount: counts.get(tag.id) ?? 0,
  }));
}

export async function filterOwnedTagIds(supabase: TypedSupabaseClient, userId: string, tagIds: string[]) {
  if (tagIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase.from("tags").select("id").eq("user_id", userId).in("id", tagIds);

  if (error) {
    logTagDataError("filter-owned-tags", error);
    throw new Error("Failed to validate tags.");
  }

  return data.map((tag) => tag.id);
}

export async function findOwnedTagByName(supabase: TypedSupabaseClient, userId: string, tagName: string) {
  const normalized = normalizeTagIdentity(tagName);

  if (!normalized) {
    return null;
  }

  const tags = await listTagsForUser(supabase, userId);
  return tags.find((tag) => normalizeTagIdentity(tag.name) === normalized) ?? null;
}

export async function createOrGetOwnedTag(
  supabase: TypedSupabaseClient,
  userId: string,
  input: { color?: string | null; name: string },
) {
  const name = tagNameSchema.parse(input.name);
  const color = normalizeTagColor(input.color);
  const existing = await findOwnedTagByName(supabase, userId, name);

  if (existing) {
    return { created: false, tag: existing };
  }

  const { data, error } = await supabase
    .from("tags")
    .insert({
      color,
      name,
      user_id: userId,
    })
    .select("id,name,color")
    .maybeSingle();

  if (isUniqueViolation(error)) {
    const retryExisting = await findOwnedTagByName(supabase, userId, name);

    if (retryExisting) {
      return { created: false, tag: retryExisting };
    }
  }

  if (error || !data) {
    logTagDataError("create-tag", error);
    throw new Error("Failed to create tag.");
  }

  return {
    created: true,
    tag: data,
  };
}
