import type { Database } from "@/types/database";

export type ClipRow = Database["public"]["Tables"]["clips"]["Row"];
export type ClipTagRow = Database["public"]["Tables"]["clip_tags"]["Row"];
export type TagRow = Database["public"]["Tables"]["tags"]["Row"];

export interface ClipWithTags extends ClipRow {
  tags: TagRow[];
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
