import { Children, cloneElement, isValidElement, useId, type PropsWithChildren, type ReactElement } from "react";

type MessageTone = "default" | "error" | "success";

export function Field({
  children,
  description,
  error,
  label,
}: PropsWithChildren<{ description?: string; error?: string; label: string }>) {
  const fieldId = useId();
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const canDescribeChild = Children.count(children) === 1 && isValidElement(children) && children.type !== "div";
  const childProps = canDescribeChild ? (children as ReactElement<Record<string, unknown>>).props : undefined;
  const existingDescribedBy =
    typeof childProps?.["aria-describedby"] === "string" ? childProps["aria-describedby"] : undefined;
  const controlId = canDescribeChild && typeof childProps?.id === "string" ? childProps.id : fieldId;
  const mergedDescribedBy = [existingDescribedBy, describedBy].filter(Boolean).join(" ") || undefined;
  const fieldControl = canDescribeChild
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-describedby": mergedDescribedBy,
        "aria-invalid": error ? true : childProps?.["aria-invalid"],
        id: controlId,
      })
    : children;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {canDescribeChild ? (
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--panel-fg)]" htmlFor={controlId}>
            {label}
          </label>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--panel-fg)]">{label}</span>
        )}
        {description ? <span className="text-xs tracking-[0.16em] text-[var(--ui-muted)]" id={descriptionId}>{description}</span> : null}
      </div>
      {fieldControl}
      {error ? <p className="text-sm font-medium text-red-700" id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}

export function FormMessage({ children, tone = "default" }: PropsWithChildren<{ tone?: MessageTone }>) {
  const toneClass: Record<MessageTone, string> = {
    default: "border-[var(--ui-border)] bg-[var(--ui-fg)] text-[var(--ui-bg)]",
    error: "border-red-700 bg-red-50 text-red-800",
    success: "border-[var(--ui-border)] bg-[var(--tag-neutral-bg)] text-[var(--panel-fg)]",
  };
  const liveProps =
    tone === "error"
      ? { "aria-live": "assertive" as const, role: "alert" }
      : { "aria-live": "polite" as const, role: "status" };

  return <div className={`border-2 px-4 py-3 text-sm ${toneClass[tone]}`} {...liveProps}>{children}</div>;
}
