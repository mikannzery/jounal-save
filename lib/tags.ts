import type { SupabaseClient } from "@supabase/supabase-js";

import type { TagRow } from "@/types/clip";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

export interface TagWithCount extends TagRow {
  usageCount: number;
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
