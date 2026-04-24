"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/clip";

const authSchema = z.object({
  email: z.email("Enter a valid email address."),
  intent: z.enum(["sign-in", "sign-up"]),
  next: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

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
        return {
          message: error.message,
          status: "error",
        };
      }

      revalidatePath("/", "layout");
      redirectTarget = next || "/clips";
    }

    if (intent === "sign-up") {
      const headerStore = await headers();
      const origin = headerStore.get("origin") ?? "http://localhost:3000";
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        return {
          message: error.message,
          status: "error",
        };
      }

      if (data.session) {
        revalidatePath("/", "layout");
        redirectTarget = "/clips";
      }

      if (!redirectTarget) {
        return {
          message: "Check your inbox to finish account setup.",
          status: "success",
        };
      }
    }
  } catch {
    return {
      message: "Authentication failed. Please try again.",
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
