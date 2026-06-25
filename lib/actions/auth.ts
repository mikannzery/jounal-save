"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { normalizeInternalRedirectPath } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/clip";

const authSchema = z.object({
  email: z.email("有効なメールアドレスを入力してください。"),
  intent: z.enum(["sign-in", "sign-up"]),
  next: z.string().optional(),
  password: z.string().min(8, "パスワードは8文字以上で入力してください。"),
});

type AuthErrorLike = {
  code?: string;
  message?: string;
  name?: string;
  status?: number;
};

function logAuthError(intent: "sign-in" | "sign-up", error: AuthErrorLike) {
  console.error("[auth-action-error]", {
    code: error.code ?? null,
    intent,
    message: error.message ?? null,
    name: error.name ?? null,
    status: error.status ?? null,
  });
}

function resolveAuthCallbackOrigin(origin: string | null) {
  const configuredSiteUrl = process.env.SITE_URL?.trim();

  if (configuredSiteUrl) {
    try {
      const parsedSiteUrl = new URL(configuredSiteUrl);

      if (parsedSiteUrl.protocol === "http:" || parsedSiteUrl.protocol === "https:") {
        return parsedSiteUrl.origin;
      }
    } catch {
      // Fall back to the request Origin validation below.
    }
  }

  try {
    const parsed = new URL(origin ?? "");

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "http://localhost:3000";
    }

    return parsed.origin;
  } catch {
    return "http://localhost:3000";
  }
}

export async function authenticateAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    intent: formData.get("intent"),
    next: formData.get("next") || undefined,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      status: "error",
    };
  }

  const supabase = await createClient();
  const { email, intent, next, password } = parsed.data;
  let redirectTarget: string | null = null;

  try {
    if (intent === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logAuthError(intent, error);
        return {
          message: "メールアドレスまたはパスワードを確認してください。",
          status: "error",
        };
      }

      revalidatePath("/", "layout");
      redirectTarget = normalizeInternalRedirectPath(next, "/clips");
    }

    if (intent === "sign-up") {
      const headerStore = await headers();
      const origin = resolveAuthCallbackOrigin(headerStore.get("origin"));
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        logAuthError(intent, error);
        return {
          message: "アカウント作成に失敗しました。入力内容を確認して、時間をおいて再試行してください。",
          status: "error",
        };
      }

      if (data.session) {
        revalidatePath("/", "layout");
        redirectTarget = "/clips";
      }

      if (!redirectTarget) {
        return {
          message: "アカウント作成を完了するため、メールをご確認ください。",
          status: "success",
        };
      }
    }
  } catch {
    return {
      message: "認証に失敗しました。時間をおいて再試行してください。",
      status: "error",
    };
  }

  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return {
    status: "idle",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
