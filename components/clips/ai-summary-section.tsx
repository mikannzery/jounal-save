"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { formatDate } from "@/lib/utils";

type AiSummaryActionState = {
  message?: string;
  status: "error" | "idle" | "success";
  summary?: string | null;
  updatedAt?: string | null;
};

interface AiSummarySectionProps {
  action: (state: AiSummaryActionState, formData: FormData) => Promise<AiSummaryActionState>;
  hasApiKey: boolean;
  initialSummary: string | null;
  initialUpdatedAt: string | null;
}

const initialAiSummaryActionState: AiSummaryActionState = {
  status: "idle",
};

function parseSummary(summary: string) {
  const lines = summary
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const intro: string[] = [];
  const bullets: string[] = [];

  for (const line of lines) {
    if (line.startsWith("- ")) {
      bullets.push(line.slice(2).trim());
      continue;
    }

    if (bullets.length > 0) {
      const lastIndex = bullets.length - 1;
      bullets[lastIndex] = `${bullets[lastIndex]} ${line}`.trim();
      continue;
    }

    intro.push(line);
  }

  return {
    bullets,
    intro,
  };
}

function AiSummarySubmitButton({
  disabled,
  hasSummary,
}: Readonly<{
  disabled: boolean;
  hasSummary: boolean;
}>) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} size="small" type="submit" variant="secondary">
      {pending ? (hasSummary ? "再生成中..." : "生成中...") : hasSummary ? "再生成" : "AI要約を生成"}
    </Button>
  );
}

export function AiSummarySection({
  action,
  hasApiKey,
  initialSummary,
  initialUpdatedAt,
}: AiSummarySectionProps) {
  const [state, formAction] = useActionState(action, initialAiSummaryActionState);
  const summary = state.status === "success" && state.summary ? state.summary : initialSummary;
  const updatedAt = state.status === "success" ? state.updatedAt ?? null : initialUpdatedAt;
  const hasSummary = Boolean(summary?.trim());
  const parsedSummary = summary ? parseSummary(summary) : null;

  return (
    <section
      className="grid max-w-4xl scroll-mt-24 gap-4 border-2 border-[var(--ui-border)] p-5 lg:scroll-mt-28 lg:p-6"
      id="ai-summary"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em]">AI要約</p>
        <form action={formAction}>
          <AiSummarySubmitButton disabled={!hasApiKey} hasSummary={hasSummary} />
        </form>
      </div>

      {!hasApiKey ? (
        <FormMessage tone="error">GEMINI_API_KEY が未設定のためAI要約を生成できません。</FormMessage>
      ) : null}
      {state.status === "error" && state.message ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "success" && state.message ? <FormMessage tone="success">{state.message}</FormMessage> : null}

      {hasSummary ? (
        <div className="grid gap-4">
          {updatedAt ? (
            <p className="text-xs text-[var(--ui-muted)]">更新日時: {formatDate(updatedAt)}</p>
          ) : null}

          {parsedSummary?.intro.length ? (
            <div className="space-y-2 text-sm leading-7">
              {parsedSummary.intro.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}

          {parsedSummary?.bullets.length ? (
            <ul className="grid gap-2 pl-5 text-sm leading-7">
              {parsedSummary.bullets.map((item, index) => (
                <li className="list-disc" key={`${item}-${index}`}>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-[var(--ui-soft)] p-4 text-sm leading-7 whitespace-pre-wrap">{summary}</div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[var(--ui-muted)]">まだAI要約はありません</p>
      )}
    </section>
  );
}
