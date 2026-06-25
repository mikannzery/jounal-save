"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUser } from "@/lib/auth";
import { MAX_CLIP_IMAGE_SIZE } from "@/lib/clip-constraints";
import { getGeminiApiKey, getGeminiModel } from "@/lib/env";
import { appendSearchParam, normalizeInternalRedirectPath } from "@/lib/navigation";
import { filterOwnedTagIds } from "@/lib/tags";
import { getClipImageBucket, getSafeExternalUrl } from "@/lib/utils";
import type { ActionState } from "@/types/clip";
import type { Database } from "@/types/database";

const clipSchema = z.object({
  body: z.string().max(20000, "本文は20,000文字以内で入力してください。"),
  memo: z.string().max(4000, "メモは4,000文字以内で入力してください。"),
  title: z.string().trim().min(1, "タイトルを入力してください。").max(160, "タイトルは160文字以内で入力してください。"),
  url: z
    .string()
    .trim()
    .max(2000, "URLは2,000文字以内で入力してください。")
    .refine((value) => !value || getSafeExternalUrl(value) !== null, "http または https のURLを入力してください。"),
});

const minimumBodyLengthForSummary = 200;
const geminiTimeoutMs = 30_000;
const clipSaveDebugEnabled = process.env.CLIP_SAVE_DEBUG === "1";

type TypedSupabaseClient = SupabaseClient<Database>;
type SupabaseErrorLike = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
};

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
    "条件:",
    "- 最初に全体の要点を1文で書く",
    "- その後に `- ` 形式の箇条書きを4〜6個書く",
    "- 各箇条書きは、あとで読み返して意味が分かる具体度で書く",
    "- 本文にない推測や断定をしない",
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

function getSupabaseErrorInfo(error: SupabaseErrorLike | null | undefined) {
  if (!error) {
    return null;
  }

  return {
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    message: error.message ?? null,
  };
}

function logClipSaveDebug(
  stage: string,
  details: {
    bucket: string;
    cleanupError?: SupabaseErrorLike | Error | null;
    dbError?: SupabaseErrorLike | null;
    dbErrorMessage?: string | null;
    fileEntry: FormDataEntryValue | null;
    storageError?: SupabaseErrorLike | null;
    storageErrorMessage?: string | null;
  },
) {
  const fileInfo = getImageDebugInfo(details.fileEntry);

  console.error("[clip-save-debug]", {
    bucket: details.bucket,
    cleanupError: getSupabaseErrorInfo(details.cleanupError),
    dbError: getSupabaseErrorInfo(details.dbError),
    dbErrorMessage: details.dbErrorMessage ?? null,
    fileName: fileInfo.name,
    fileSize: fileInfo.size,
    fileType: fileInfo.type,
    hasFile: fileInfo.hasFile,
    stage,
    storageError: getSupabaseErrorInfo(details.storageError),
    storageErrorMessage: details.storageErrorMessage ?? null,
  });
}

function logClipSaveStart(mode: "create" | "update", bucket: string, fileEntry: FormDataEntryValue | null, clipId?: string) {
  if (!clipSaveDebugEnabled) {
    return;
  }

  console.info("[clip-save-debug]", {
    bucket,
    ...getImageDebugInfo(fileEntry),
    clipId: clipId ?? null,
    mode,
    stage: "start",
  });
}

function logAiSummaryError(stage: string, details: { message?: string | null; status?: number | null }) {
  console.error("[ai-summary-error]", {
    message: details.message ?? null,
    stage,
    status: details.status ?? null,
  });
}

function logClipTagReplaceError(stage: string, error: SupabaseErrorLike | null | undefined) {
  console.error("[clip-tags-error]", {
    error: getSupabaseErrorInfo(error),
    stage,
  });
}

function revalidateClipLists() {
  revalidatePath("/clips");
  revalidatePath("/favorites");
  revalidatePath("/archive");
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
    return "画像ファイルを選択してください。";
  }

  if (image.size > MAX_CLIP_IMAGE_SIZE) {
    return "画像は5MB以下にしてください。";
  }

  return null;
}

function sanitizeFileName(fileName: string) {
  const sanitized = fileName
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 80)
    .toLowerCase();

  return sanitized || "clip-image";
}

async function uploadClipImage(supabase: TypedSupabaseClient, userId: string, image: File) {
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
      error,
      errorMessage: error.message,
      imagePath: null,
    };
  }

  return {
    bucket,
    error: null,
    errorMessage: null,
    imagePath,
  };
}

async function deleteClipImage(supabase: TypedSupabaseClient, imagePath: string | null | undefined) {
  if (!imagePath) {
    return;
  }

  const bucket = getClipImageBucket();
  const { error } = await supabase.storage.from(bucket).remove([imagePath]);

  if (error) {
    logClipSaveDebug("storage-delete-failed", {
      bucket,
      fileEntry: null,
      storageError: error,
      storageErrorMessage: error.message,
    });
  }
}

async function cleanupCreatedClipAfterFailure(
  supabase: TypedSupabaseClient,
  userId: string,
  clipId: string | null,
  imagePath: string | null,
) {
  if (clipId) {
    const { error } = await supabase.from("clips").delete().eq("id", clipId).eq("user_id", userId);

    if (error) {
      logClipSaveDebug("create:cleanup-clip-delete-failed", {
        bucket: getClipImageBucket(),
        cleanupError: error,
        dbErrorMessage: error.message,
        fileEntry: null,
      });
    }
  }

  await deleteClipImage(supabase, imagePath);
}

async function replaceClipTags(supabase: TypedSupabaseClient, userId: string, clipId: string, tagIds: string[]) {
  const validTagIds = await filterOwnedTagIds(supabase, userId, [...new Set(tagIds)]);
  const { data: existingClipTags, error: selectError } = await supabase
    .from("clip_tags")
    .select("tag_id")
    .eq("clip_id", clipId);

  if (selectError) {
    logClipTagReplaceError("select-existing", selectError);
    throw new Error("Failed to update clip tags.");
  }

  const existingTagIds = existingClipTags.map((clipTag) => clipTag.tag_id);
  const validTagIdSet = new Set(validTagIds);
  const existingTagIdSet = new Set(existingTagIds);
  const tagIdsToInsert = validTagIds.filter((tagId) => !existingTagIdSet.has(tagId));
  const tagIdsToDelete = existingTagIds.filter((tagId) => !validTagIdSet.has(tagId));

  if (tagIdsToInsert.length > 0) {
    const { error: insertError } = await supabase.from("clip_tags").insert(
      tagIdsToInsert.map((tagId) => ({
        clip_id: clipId,
        tag_id: tagId,
      })),
    );

    if (insertError) {
      logClipTagReplaceError("insert-new", insertError);
      throw new Error("Failed to update clip tags.");
    }
  }

  if (validTagIds.length === 0) {
    const { error: deleteError } = await supabase.from("clip_tags").delete().eq("clip_id", clipId);

    if (deleteError) {
      logClipTagReplaceError("delete-all", deleteError);
      throw new Error("Failed to update clip tags.");
    }

    return;
  }

  if (tagIdsToDelete.length === 0) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("clip_tags")
    .delete()
    .eq("clip_id", clipId)
    .in("tag_id", tagIdsToDelete);

  if (deleteError) {
    logClipTagReplaceError("delete-removed", deleteError);
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
  const safeUrl = getSafeExternalUrl(url);
  const tagIds = formData.getAll("tagIds").map(String);
  let clipId: string | null = null;
  let uploadedImagePath: string | null = null;

  logClipSaveStart("create", bucket, imageEntry);

  try {
    if (image) {
      const uploadResult = await uploadClipImage(supabase, user.id, image);

      if (!uploadResult.imagePath) {
        logClipSaveDebug("create:storage-upload-failed", {
          bucket: uploadResult.bucket,
          fileEntry: imageEntry,
          storageError: uploadResult.error,
          storageErrorMessage: uploadResult.errorMessage,
        });

        return {
          message: "画像のアップロードに失敗しました。時間をおいて再試行してください。",
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
        url: safeUrl,
        user_id: user.id,
      })
      .select("id")
      .maybeSingle();

    if (error || !data) {
      if (uploadedImagePath) {
        await deleteClipImage(supabase, uploadedImagePath);
      }

      logClipSaveDebug("create:db-insert-failed", {
        bucket,
        dbError: error,
        dbErrorMessage: error?.message ?? "Insert returned no data.",
        fileEntry: imageEntry,
      });

      return {
        message: "記事の保存に失敗しました。時間をおいて再試行してください。",
        status: "error",
      };
    }

    clipId = data.id;
    await replaceClipTags(supabase, user.id, clipId, tagIds);
  } catch (error) {
    await cleanupCreatedClipAfterFailure(supabase, user.id, clipId, uploadedImagePath);

    logClipSaveDebug("create:unexpected-failure", {
      bucket,
      dbErrorMessage: error instanceof Error ? error.message : "Unknown error",
      fileEntry: imageEntry,
    });

    return {
      message: "記事の保存に失敗しました。時間をおいて再試行してください。",
      status: "error",
    };
  }

  revalidateClipLists();
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
  const safeUrl = getSafeExternalUrl(url);
  const tagIds = formData.getAll("tagIds").map(String);
  let uploadedImagePath: string | null = null;
  let existingImagePath: string | null = null;

  logClipSaveStart("update", bucket, imageEntry, clipId);

  try {
    const { data: existingClip, error: existingError } = await supabase
      .from("clips")
      .select("image_path")
      .eq("id", clipId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError || !existingClip) {
      logClipSaveDebug("update:load-existing-failed", {
        bucket,
        dbError: existingError,
        dbErrorMessage: existingError?.message ?? "Existing clip was not found.",
        fileEntry: imageEntry,
      });

      return {
        message: "記事を保存できませんでした。記事が見つからないか、権限がありません。",
        status: "error",
      };
    }

    existingImagePath = existingClip.image_path;

    if (image) {
      const uploadResult = await uploadClipImage(supabase, user.id, image);

      if (!uploadResult.imagePath) {
        logClipSaveDebug("update:storage-upload-failed", {
          bucket: uploadResult.bucket,
          fileEntry: imageEntry,
          storageError: uploadResult.error,
          storageErrorMessage: uploadResult.errorMessage,
        });

        return {
          message: "画像のアップロードに失敗しました。時間をおいて再試行してください。",
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
        url: safeUrl,
      })
      .eq("id", clipId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      if (uploadedImagePath) {
        await deleteClipImage(supabase, uploadedImagePath);
      }

      logClipSaveDebug("update:db-update-failed", {
        bucket,
        dbError: error,
        dbErrorMessage: error?.message ?? "Update returned no data.",
        fileEntry: imageEntry,
      });

      return {
        message: "記事の保存に失敗しました。時間をおいて再試行してください。",
        status: "error",
      };
    }

    await replaceClipTags(supabase, user.id, clipId, tagIds);

    if (uploadedImagePath && existingImagePath && existingImagePath !== uploadedImagePath) {
      await deleteClipImage(supabase, existingImagePath);
    }
  } catch (error) {
    if (uploadedImagePath) {
      await deleteClipImage(supabase, uploadedImagePath);
    }

    logClipSaveDebug("update:unexpected-failure", {
      bucket,
      dbErrorMessage: error instanceof Error ? error.message : "Unknown error",
      fileEntry: imageEntry,
    });

    return {
      message: "記事の保存に失敗しました。時間をおいて再試行してください。",
      status: "error",
    };
  }

  revalidateClipLists();
  revalidatePath(`/clips/${clipId}`);
  redirect(`/clips/${clipId}?status=updated`);
}

export async function archiveClipAction(clipId: string) {
  const { supabase, user } = await requireUser();
  let failed = false;

  try {
    const { data, error } = await supabase
      .from("clips")
      .update({
        is_archived: true,
      })
      .eq("id", clipId)
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      failed = true;
    }
  } catch {
    failed = true;
  }

  if (failed) {
    redirect(`/clips/${clipId}?error=archive`);
  }

  revalidateClipLists();
  revalidatePath(`/clips/${clipId}`);
  redirect("/archive?status=archived");
}

export async function bulkArchiveClipsAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const clipIds = [...new Set(formData.getAll("clipIds").map(String).filter(Boolean))];
  const returnTo = normalizeInternalRedirectPath(String(formData.get("returnTo") ?? "/clips"), "/clips");

  if (clipIds.length === 0) {
    redirect(appendSearchParam(returnTo, "error", "bulk_archive"));
  }

  try {
    const { data, error } = await supabase
      .from("clips")
      .update({
        is_archived: true,
      })
      .in("id", clipIds)
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .select("id");

    if (error || data.length === 0) {
      redirect(appendSearchParam(returnTo, "error", "bulk_archive"));
    }
  } catch {
    redirect(appendSearchParam(returnTo, "error", "bulk_archive"));
  }

  revalidateClipLists();
  redirect("/archive?status=bulk_archived");
}

export async function restoreClipAction(clipId: string) {
  const { supabase, user } = await requireUser();
  let failed = false;

  try {
    const { data, error } = await supabase
      .from("clips")
      .update({
        is_archived: false,
      })
      .eq("id", clipId)
      .eq("user_id", user.id)
      .eq("is_archived", true)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      failed = true;
    }
  } catch {
    failed = true;
  }

  if (failed) {
    redirect("/archive?error=restore");
  }

  revalidateClipLists();
  redirect("/archive?status=restored");
}

export async function deleteClipAction(clipId: string) {
  const { supabase, user } = await requireUser();
  let failed = false;
  let imagePath: string | null = null;

  try {
    const { data: existingClip, error: existingClipError } = await supabase
      .from("clips")
      .select("image_path")
      .eq("id", clipId)
      .eq("user_id", user.id)
      .eq("is_archived", true)
      .maybeSingle();

    if (existingClipError || !existingClip) {
      failed = true;
    }

    imagePath = existingClip?.image_path ?? null;

    if (!failed) {
      const { data, error } = await supabase
        .from("clips")
        .delete()
        .eq("id", clipId)
        .eq("user_id", user.id)
        .eq("is_archived", true)
        .select("id")
        .maybeSingle();

      if (error || !data) {
        failed = true;
      }
    }
  } catch {
    failed = true;
  }

  if (failed) {
    redirect("/archive?error=delete");
  }

  if (imagePath) {
    await deleteClipImage(supabase, imagePath);
  }

  revalidateClipLists();
  redirect("/archive?status=deleted");
}

export async function setFavoriteClipAction(clipId: string, isFavorite: boolean) {
  const { supabase, user } = await requireUser();

  try {
    const { data, error } = await supabase
      .from("clips")
      .update({
        is_favorite: isFavorite,
      })
      .eq("id", clipId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return;
    }
  } catch {
    return;
  }

  revalidateClipLists();
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
    .maybeSingle();

  if (clipError) {
    logAiSummaryError("load-clip:db-error", {
      message: clipError.message,
      status: null,
    });

    return {
      message: "AI要約の準備に失敗しました。時間をおいて再試行してください。",
      status: "error",
    };
  }

  if (!clip) {
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
      logAiSummaryError("generate:api-error", {
        message: payload?.error?.message ?? null,
        status: response.status,
      });

      return {
        message: "AI要約の生成に失敗しました。時間をおいて再試行してください。",
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
