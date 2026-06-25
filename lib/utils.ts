import { clsx, type ClassValue } from "clsx";
import type { SupabaseClient } from "@supabase/supabase-js";
import { twMerge } from "tailwind-merge";

import type { Database } from "@/types/database";

const clipImageBucket = "clip-images";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

export function getDomainLabel(url: string | null) {
  const safeUrl = getSafeExternalUrl(url);

  if (!safeUrl) {
    return null;
  }

  try {
    return new URL(safeUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function getSafeExternalUrl(url: string | null | undefined) {
  const trimmedUrl = url?.trim();

  if (!trimmedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function getExcerpt(text: string | null, maxLength = 120) {
  if (!text) {
    return "本文はまだ保存されていません。";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

export async function getSignedClipImageUrl(
  supabase: SupabaseClient<Database>,
  imagePath: string | null | undefined,
  expiresIn = 60 * 60,
) {
  if (!imagePath) {
    return null;
  }

  const bucket = getClipImageBucket();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(imagePath, expiresIn);

  if (error) {
    console.error("[clip-image-signed-url]", {
      bucket,
      errorMessage: error.message,
      imagePath,
    });
    return null;
  }

  return data.signedUrl;
}

export function getClipImageBucket() {
  return clipImageBucket;
}
