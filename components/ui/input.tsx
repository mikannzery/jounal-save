import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-14 w-full border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] px-5 text-base text-[var(--panel-fg)] outline-none transition placeholder:text-[var(--ui-muted)] focus:border-[var(--ui-border)] focus:bg-[var(--ui-fg)] focus:text-[var(--ui-bg)] focus:placeholder:text-[color:rgba(246,245,239,0.7)]",
        className,
      )}
      {...props}
    />
  );
}
