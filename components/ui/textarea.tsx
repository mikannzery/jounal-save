import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] px-5 py-4 text-base leading-8 text-[var(--panel-fg)] outline-none transition placeholder:text-[var(--ui-muted)] focus:border-[var(--ui-border)] focus:bg-[var(--ui-fg)] focus:text-[var(--ui-bg)] focus:placeholder:text-[color:rgba(246,245,239,0.7)]",
        className,
      )}
      {...props}
    />
  );
}
