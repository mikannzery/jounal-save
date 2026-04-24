import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { TagRow } from "@/types/clip";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

export const DEFAULT_TAG_COLOR = "#111111";
export const tagNameSchema = z.string().trim().min(1, "Tag name is required.").max(40, "Tag name must be 40 characters or less.");
export const tagColorSchema = z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Choose a valid color.");

export interface TagWithCount extends TagRow {
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

export async function listTagsForUser(supabase: TypedSupabaseClient, userId: string) {
  const { data, error } = await supabase.from("tags").select("*").eq("user_id", userId).order("name", { ascending: true });

  if (error) {
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
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Failed to create tag.");
  }

  return {
    created: true,
    tag: data,
  };
}
