import type { Database } from "@/types/database";

export type ClipRow = Database["public"]["Tables"]["clips"]["Row"];
export type ClipTagRow = Database["public"]["Tables"]["clip_tags"]["Row"];
export type ClipTagSummary = Pick<ClipTagRow, "clip_id" | "tag_id">;
export type TagRow = Database["public"]["Tables"]["tags"]["Row"];
export type TagSummary = Pick<TagRow, "color" | "id" | "name">;

export interface ClipWithTags extends ClipRow {
  tags: TagSummary[];
}

export interface ClipFormValues {
  body: string;
  image_path: string;
  memo: string;
  tagIds: string[];
  title: string;
  url: string;
}

export interface ActionState {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "idle" | "error" | "success";
}

export const initialActionState: ActionState = {
  status: "idle",
};
