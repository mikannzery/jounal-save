"use client";

import { useActionState } from "react";

import { authenticateAction } from "@/lib/actions/auth";
import { initialActionState } from "@/types/clip";

import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function AuthForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(authenticateAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-6 border-2 border-black bg-white p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]">ログイン</p>
        <h1 className="text-4xl font-black uppercase leading-none md:text-5xl">CLIP MEMO</h1>
        <p className="text-sm text-black/70">メールアドレスとパスワードでログイン、または初回アカウント作成を行います。</p>
      </div>

      {state.message ? <FormMessage tone={state.status === "error" ? "error" : "success"}>{state.message}</FormMessage> : null}

      <input name="next" type="hidden" value={next ?? ""} />

      <Field error={state.fieldErrors?.email?.[0]} label="メールアドレス">
        <Input autoComplete="email" name="email" placeholder="[email protected]" required type="email" />
      </Field>

      <Field description="8文字以上" error={state.fieldErrors?.password?.[0]} label="パスワード">
        <Input autoComplete="current-password" name="password" required type="password" />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SubmitButton idleLabel="ログイン" name="intent" pendingLabel="ログイン中..." value="sign-in" variant="primary" />
        <SubmitButton idleLabel="アカウント作成" name="intent" pendingLabel="作成中..." value="sign-up" variant="secondary" />
      </div>
    </form>
  );
}
