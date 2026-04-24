"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { getGeminiApiKey, getGeminiModel } from "@/lib/env";
import { getClipImageBucket } from "@/lib/utils";
import { filterOwnedTagIds } from "@/lib/tags";
import type { ActionState } from "@/types/clip";

const clipSchema = z.object({
  body: z.string().max(20000, "Body must be 20000 characters or less."),
  memo: z.string().max(4000, "Memo must be 4000 characters or less."),
  title: z.string().trim().min(1, "Title is required.").max(160, "Title must be 160 characters or less."),
  url: z
    .string()
    .trim()
    .max(2000, "URL must be 2000 characters or less.")
    .refine((value) => !value || z.url().safeParse(value).success, "Enter a valid URL."),
});

const maxImageSize = 5 * 1024 * 1024;
const minimumBodyLengthForSummary = 200;
const geminiTimeoutMs = 30_000;

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type AiSummaryActionState = {
  message?: string;
  status: "error" | "idle" | "success";
  summary?: string | null;
  updatedAt?: string | null;
};

function normalizeClipBody(body: string | null) {
  return (body ?? "").replace(/\s+/g, " ").trim();
}

function buildSummaryPrompt(body: string) {
  return [
    "以下の本文を日本語で要約してください。",
    "",
    "要件:",
    "- 最初に全体の要旨を1〜2文で書く",
    "- その後に `- ` 形式の箇条書きを4〜6個書く",
    "- 各箇条書きは後で読み返して意味が分かる密度で書く",
    "- 元文にない推測や断定をしない",
    "- 感想ではなく内容整理として書く",
    "",
    "本文:",
    body,
  ].join("\n");
}

function extractSummaryText(payload: GeminiGenerateContentResponse | null) {
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();

  return text || null;
}

function getImageDebugInfo(image: FormDataEntryValue | null) {
  if (!(image instanceof File)) {
    return {
      hasFile: false,
      name: null,
      size: null,
      type: null,
    };
  }

  return {
    hasFile: image.size > 0,
    name: image.name || null,
    size: image.size,
    type: image.type || null,
  };
}

function logClipSaveDebug(
  stage: string,
  details: {
    bucket: string;
    dbErrorMessage?: string | null;
    fileEntry: FormDataEntryValue | null;
    storageErrorMessage?: string | null;
  },
) {
  const fileInfo = getImageDebugInfo(details.fileEntry);

  console.error("[clip-save-debug]", {
    bucket: details.bucket,
    dbErrorMessage: details.dbErrorMessage ?? null,
    fileName: fileInfo.name,
    fileSize: fileInfo.size,
    fileType: fileInfo.type,
    hasFile: fileInfo.hasFile,
    stage,
    storageErrorMessage: details.storageErrorMessage ?? null,
  });
}

function parseClipValues(formData: FormData) {
  return clipSchema.safeParse({
    body: String(formData.get("body") ?? ""),
    memo: String(formData.get("memo") ?? ""),
    title: String(formData.get("title") ?? ""),
    url: String(formData.get("url") ?? ""),
  });
}

function getImageFile(formData: FormData) {
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  return image;
}

function validateImageFile(image: File) {
  if (!image.type.startsWith("image/")) {
    return "Select an image file only.";
  }

  if (image.size > maxImageSize) {
    return "Image must be 5MB or smaller.";
  }

  return null;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").toLowerCase();
}

async function uploadClipImage(userId: string, image: File) {
  const { supabase } = await requireUser();
  const safeName = sanitizeFileName(image.name || "clip-image");
  const imagePath = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const bucket = getClipImageBucket();

  const { error } = await supabase.storage.from(bucket).upload(imagePath, image, {
    cacheControl: "3600",
    contentType: image.type,
    upsert: false,
  });

  if (error) {
    return {
      bucket,
      errorMessage: error.message,
      imagePath: null,
    };
  }

  return {
    bucket,
    errorMessage: null,
    imagePath,
  };
}

async function deleteClipImage(imagePath: string | null | undefined) {
  if (!imagePath) {
    return;
  }

  const { supabase } = await requireUser();
  const bucket = getClipImageBucket();
  await supabase.storage.from(bucket).remove([imagePath]);
}

async function replaceClipTags(clipId: string, tagIds: string[]) {
  const { supabase, user } = await requireUser();
  const validTagIds = await filterOwnedTagIds(supabase, user.id, [...new Set(tagIds)]);

  const { error: deleteError } = await supabase.from("clip_tags").delete().eq("clip_id", clipId);

  if (deleteError) {
    throw new Error("Failed to update clip tags.");
  }

  if (validTagIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("clip_tags").insert(
    validTagIds.map((tagId) => ({
      clip_id: clipId,
      tag_id: tagId,
    })),
  );

  if (insertError) {
    throw new Error("Failed to update clip tags.");
  }
}

export async function createClipAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseClipValues(formData);
  const imageEntry = formData.get("image");
  const bucket = getClipImageBucket();

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      status: "error",
    };
  }

  const image = getImageFile(formData);

  if (image) {
    const imageError = validateImageFile(image);

    if (imageError) {
      return {
        fieldErrors: {
          image: [imageError],
        },
        status: "error",
      };
    }
  }

  const { supabase, user } = await requireUser();
  const { body, memo, title, url } = parsed.data;
  const tagIds = formData.getAll("tagIds").map(String);
  let clipId: string | null = null;
  let uploadedImagePath: string | null = null;

  console.info("[clip-save-debug]", {
    bucket,
    ...getImageDebugInfo(imageEntry),
    mode: "create",
    stage: "start",
  });

  try {
    if (image) {
      const uploadResult = await uploadClipImage(user.id, image);

      if (!uploadResult.imagePath) {
        logClipSaveDebug("create:storage-upload-failed", {
          bucket: uploadResult.bucket,
          fileEntry: imageEntry,
          storageErrorMessage: uploadResult.errorMessage,
        });

        return {
          message: "Failed to upload the image.",
          status: "error",
        };
      }

      uploadedImagePath = uploadResult.imagePath;
    }

    const { data, error } = await supabase
      .from("clips")
      .insert({
        body: body || null,
        image_path: uploadedImagePath,
        is_archived: false,
        is_favorite: false,
        memo: memo || null,
        title,
        url: url || null,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      if (uploadedImagePath) {
        await deleteClipImage(uploadedImagePath);
      }

      logClipSaveDebug("create:db-insert-failed", {
        bucket,
        dbErrorMessage: error?.message ?? "Insert returned no data.",
        fileEntry: imageEntry,
      });

      return {
        message: "Failed to save the clip.",
        status: "error",
      };
    }

    clipId = data.id;
    await replaceClipTags(clipId, tagIds);
  } catch (error) {
    if (uploadedImagePath) {
      await deleteClipImage(uploadedImagePath);
    }

    logClipSaveDebug("create:unexpected-failure", {
      bucket,
      dbErrorMessage: error instanceof Error ? error.message : "Unknown error",
      fileEntry: imageEntry,
    });

    return {
      message: "Failed to save the clip.",
      status: "error",
    };
  }

  revalidatePath("/clips");
  revalidatePath("/favorites");
  revalidatePath("/archive");
  redirect(`/clips/${clipId}?status=created`);
}

export async function updateClipAction(clipId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseClipValues(formData);
  const imageEntry = formData.get("image");
  const bucket = getClipImageBucket();

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      status: "error",
    };
  }

  const image = getImageFile(formData);

  if (image) {
    const imageError = validateImageFile(image);

    if (imageError) {
      return {
        fieldErrors: {
          image: [imageError],
        },
        status: "error",
      };
    }
  }

  const { supabase, user } = await requireUser();
  const { body, memo, title, url } = parsed.data;
  const tagIds = formData.getAll("tagIds").map(String);
  let uploadedImagePath: string | null = null;
  let existingImagePath: string | null = null;

  console.info("[clip-save-debug]", {
    bucket,
    ...getImageDebugInfo(imageEntry),
    clipId,
    mode: "update",
    stage: "start",
  });

  try {
    const { data: existingClip, error: existingError } = await supabase
      .from("clips")
      .select("image_path")
      .eq("id", clipId)
      .eq("user_id", user.id)
      .single();

    if (existingError || !existingClip) {
      logClipSaveDebug("update:load-existing-failed", {
        bucket,
        dbErrorMessage: existingError?.message ?? "Existing clip was not found.",
        fileEntry: imageEntry,
      });

      return {
        message: "Failed to update the clip.",
        status: "error",
      };
    }

    existingImagePath = existingClip.image_path;

    if (image) {
      const uploadResult = await uploadClipImage(user.id, image);

      if (!uploadResult.imagePath) {
        logClipSaveDebug("update:storage-upload-failed", {
          bucket: uploadResult.bucket,
          fileEntry: imageEntry,
          storageErrorMessage: uploadResult.errorMessage,
        });

        return {
          message: "Failed to upload the image.",
          status: "error",
        };
      }

      uploadedImagePath = uploadResult.imagePath;
    }

    const { data, error } = await supabase
      .from("clips")
      .update({
        body: body || null,
        image_path: uploadedImagePath ?? existingImagePath,
        memo: memo || null,
        title,
        url: url || null,
      })
      .eq("id", clipId)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (error || !data) {
      if (uploadedImagePath) {
        await deleteClipImage(uploadedImagePath);
      }

      logClipSaveDebug("update:db-update-failed", {
        bucket,
        dbErrorMessage: error?.message ?? "Update returned no data.",
        fileEntry: imageEntry,
      });

      return {
        message: "Failed to update the clip.",
        status: "error",
      };
    }

    await replaceClipTags(clipId, tagIds);

    if (uploadedImagePath && existingImagePath && existingImagePath !== uploadedImagePath) {
      await deleteClipImage(existingImagePath);
    }
  } catch (error) {
    if (uploadedImagePath) {
      await deleteClipImage(uploadedImagePath);
    }

    logClipSaveDebug("update:unexpected-failure", {
      bucket,
      dbErrorMessage: error instanceof Error ? error.message : "Unknown error",
      fileEntry: imageEntry,
    });

    return {
      message: "Failed to update the clip.",
      status: "error",
    };
  }

  revalidatePath("/clips");
  revalidatePath("/favorites");
  revalidatePath("/archive");
  revalidatePath(`/clips/${clipId}`);
  redirect(`/clips/${clipId}?status=updated`);
}

export async function archiveClipAction(clipId: string) {
  const { supabase, user } = await requireUser();
  let failed = false;

  try {
    const { error } = await supabase
      .from("clips")
      .update({
        is_archived: true,
      })
      .eq("id", clipId)
      .eq("user_id", user.id);

    if (error) {
      failed = true;
    }
  } catch {
    failed = true;
  }

  if (failed) {
    redirect(`/clips/${clipId}?error=archive`);
  }

  revalidatePath("/clips");
  revalidatePath("/favorites");
  revalidatePath("/archive");
  revalidatePath(`/clips/${clipId}`);
  redirect("/archive?status=archived");
}

export async function bulkArchiveClipsAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const clipIds = [...new Set(formData.getAll("clipIds").map(String).filter(Boolean))];
  const returnTo = String(formData.get("returnTo") ?? "/clips");

  if (clipIds.length === 0) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=bulk_archive`);
  }

  try {
    const { error } = await supabase
      .from("clips")
      .update({
        is_archived: true,
      })
      .in("id", clipIds)
      .eq("user_id", user.id)
      .eq("is_archived", false);

    if (error) {
      redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=bulk_archive`);
    }
  } catch {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=bulk_archive`);
  }

  revalidatePath("/clips");
  revalidatePath("/favorites");
  revalidatePath("/archive");
  redirect("/archive?status=bulk_archived");
}

export async function restoreClipAction(clipId: string) {
  const { supabase, user } = await requireUser();
  let failed = false;

  try {
    const { error } = await supabase
      .from("clips")
      .update({
        is_archived: false,
      })
      .eq("id", clipId)
      .eq("user_id", user.id);

    if (error) {
      failed = true;
    }
  } catch {
    failed = true;
  }

  if (failed) {
    redirect("/archive?error=restore");
  }

  revalidatePath("/clips");
  revalidatePath("/favorites");
  revalidatePath("/archive");
  redirect("/archive?status=restored");
}

export async function deleteClipAction(clipId: string) {
  const { supabase, user } = await requireUser();
  let failed = false;
  let imagePath: string | null = null;

  try {
    const { data: existingClip } = await supabase
      .from("clips")
      .select("image_path")
      .eq("id", clipId)
      .eq("user_id", user.id)
      .eq("is_archived", true)
      .maybeSingle();

    imagePath = existingClip?.image_path ?? null;

    const { error } = await supabase
      .from("clips")
      .delete()
      .eq("id", clipId)
      .eq("user_id", user.id)
      .eq("is_archived", true);

    if (error) {
      failed = true;
    }
  } catch {
    failed = true;
  }

  if (failed) {
    redirect("/archive?error=delete");
  }

  if (imagePath) {
    await deleteClipImage(imagePath);
  }

  revalidatePath("/clips");
  revalidatePath("/favorites");
  revalidatePath("/archive");
  redirect("/archive?status=deleted");
}

export async function setFavoriteClipAction(clipId: string, isFavorite: boolean) {
  const { supabase, user } = await requireUser();

  try {
    const { error } = await supabase
      .from("clips")
      .update({
        is_favorite: isFavorite,
      })
      .eq("id", clipId)
      .eq("user_id", user.id);

    if (error) {
      return;
    }
  } catch {
    return;
  }

  revalidatePath("/clips");
  revalidatePath("/favorites");
  revalidatePath("/archive");
  revalidatePath(`/clips/${clipId}`);
}

export async function generateAiSummaryAction(
  clipId: string,
  previousState: AiSummaryActionState,
  formData: FormData,
): Promise<AiSummaryActionState> {
  void previousState;
  void formData;

  const { supabase, user } = await requireUser();
  const { data: clip, error: clipError } = await supabase
    .from("clips")
    .select("body")
    .eq("id", clipId)
    .eq("user_id", user.id)
    .single();

  if (clipError || !clip) {
    return {
      message: "記事が見つかりませんでした。",
      status: "error",
    };
  }

  const normalizedBody = normalizeClipBody(clip.body);

  if (normalizedBody.length < minimumBodyLengthForSummary) {
    return {
      message: `本文が短いためAI要約を生成できません。本文を${minimumBodyLengthForSummary}文字以上にしてから再実行してください。`,
      status: "error",
    };
  }

  let apiKey = "";

  try {
    apiKey = getGeminiApiKey();
  } catch {
    return {
      message: "GEMINI_API_KEY が未設定のためAI要約を生成できません。",
      status: "error",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), geminiTimeoutMs);
  const model = getGeminiModel();
  let summary: string | null = null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: buildSummaryPrompt(normalizedBody),
                },
              ],
              role: "user",
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: controller.signal,
      },
    );

    const payload = (await response.json().catch(() => null)) as GeminiGenerateContentResponse | null;

    if (!response.ok) {
      const reason = payload?.error?.message;
      return {
        message: reason ? `AI要約の生成に失敗しました: ${reason}` : "AI要約の生成に失敗しました。",
        status: "error",
      };
    }

    summary = extractSummaryText(payload);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        message: "AI要約の生成がタイムアウトしました。時間をおいて再試行してください。",
        status: "error",
      };
    }

    return {
      message: "AI要約の生成に失敗しました。",
      status: "error",
    };
  } finally {
    clearTimeout(timeoutId);
  }

  if (!summary) {
    return {
      message: "AI要約の生成結果が空でした。時間をおいて再試行してください。",
      status: "error",
    };
  }

  const aiSummaryUpdatedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("clips")
    .update({
      ai_summary: summary,
      ai_summary_updated_at: aiSummaryUpdatedAt,
    })
    .eq("id", clipId)
    .eq("user_id", user.id);

  if (updateError) {
    return {
      message: "AI要約の保存に失敗しました。",
      status: "error",
    };
  }

  revalidatePath(`/clips/${clipId}`);

  return {
    message: "AI要約を更新しました。",
    status: "success",
    summary,
    updatedAt: aiSummaryUpdatedAt,
  };
}
