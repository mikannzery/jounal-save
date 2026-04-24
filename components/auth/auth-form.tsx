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
        <p className="text-xs font-semibold uppercase tracking-[0.24em]">Auth</p>
        <h1 className="text-4xl font-black uppercase leading-none md:text-5xl">Log In</h1>
        <p className="text-sm text-black/70">Email and password sign-in, plus first-time account creation.</p>
      </div>

      {state.message ? <FormMessage tone={state.status === "error" ? "error" : "success"}>{state.message}</FormMessage> : null}

      <input name="next" type="hidden" value={next ?? ""} />

      <Field error={state.fieldErrors?.email?.[0]} label="Email">
        <Input autoComplete="email" name="email" placeholder="[email protected]" required type="email" />
      </Field>

      <Field description="8 characters minimum" error={state.fieldErrors?.password?.[0]} label="Password">
        <Input autoComplete="current-password" name="password" required type="password" />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SubmitButton idleLabel="Log In" name="intent" pendingLabel="Signing In..." value="sign-in" variant="primary" />
        <SubmitButton idleLabel="Create Account" name="intent" pendingLabel="Creating..." value="sign-up" variant="secondary" />
      </div>
    </form>
  );
}
