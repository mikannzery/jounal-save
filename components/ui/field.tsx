import type { PropsWithChildren } from "react";

type MessageTone = "default" | "error" | "success";

export function Field({
  children,
  description,
  error,
  label,
}: PropsWithChildren<{ description?: string; error?: string; label: string }>) {
  return (
    <label className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--panel-fg)]">{label}</span>
        {description ? <span className="text-xs tracking-[0.16em] text-[var(--ui-muted)]">{description}</span> : null}
      </div>
      {children}
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
    </label>
  );
}

export function FormMessage({ children, tone = "default" }: PropsWithChildren<{ tone?: MessageTone }>) {
  const toneClass: Record<MessageTone, string> = {
    default: "border-[var(--ui-border)] bg-[var(--ui-fg)] text-[var(--ui-bg)]",
    error: "border-red-700 bg-red-50 text-red-800",
    success: "border-[var(--ui-border)] bg-[var(--tag-neutral-bg)] text-[var(--panel-fg)]",
  };

  return <div className={`border-2 px-4 py-3 text-sm ${toneClass[tone]}`}>{children}</div>;
}
