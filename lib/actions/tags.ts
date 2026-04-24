"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";

const tagSchema = z.object({
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Choose a valid color."),
  name: z.string().trim().min(1, "Tag name is required.").max(40, "Tag name must be 40 characters or less."),
});

function parseTagValues(formData: FormData) {
  return tagSchema.safeParse({
    color: String(formData.get("color") ?? "#111111"),
    name: String(formData.get("name") ?? ""),
  });
}

function revalidateTagPaths() {
  revalidatePath("/tags");
  revalidatePath("/clips");
  revalidatePath("/favorites");
  revalidatePath("/archive");
  revalidatePath("/clips/new");
}

export async function createTagAction(formData: FormData) {
  const parsed = parseTagValues(formData);

  if (!parsed.success) {
    redirect("/tags?error=create");
  }

  const { supabase, user } = await requireUser();

  try {
    const { error } = await supabase.from("tags").insert({
      color: parsed.data.color,
      name: parsed.data.name,
      user_id: user.id,
    });

    if (error) {
      redirect("/tags?error=create");
    }
  } catch {
    redirect("/tags?error=create");
  }

  revalidateTagPaths();
  redirect("/tags?status=created");
}

export async function updateTagAction(tagId: string, formData: FormData) {
  const parsed = parseTagValues(formData);

  if (!parsed.success) {
    redirect("/tags?error=update");
  }

  const { supabase, user } = await requireUser();

  try {
    const { error } = await supabase
      .from("tags")
      .update({
        color: parsed.data.color,
        name: parsed.data.name,
      })
      .eq("id", tagId)
      .eq("user_id", user.id);

    if (error) {
      redirect("/tags?error=update");
    }
  } catch {
    redirect("/tags?error=update");
  }

  revalidateTagPaths();
  redirect("/tags?status=updated");
}

export async function deleteTagAction(tagId: string) {
  const { supabase, user } = await requireUser();

  try {
    const { error } = await supabase.from("tags").delete().eq("id", tagId).eq("user_id", user.id);

    if (error) {
      redirect("/tags?error=delete");
    }
  } catch {
    redirect("/tags?error=delete");
  }

  revalidateTagPaths();
  redirect("/tags?status=deleted");
}
