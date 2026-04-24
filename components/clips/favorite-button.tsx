"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { StarIcon } from "@/components/ui/icons";

export function FavoriteButton({
  active,
  className,
  fullWidth = false,
  size = "icon",
}: {
  active: boolean;
  className?: string;
  fullWidth?: boolean;
  size?: "default" | "icon" | "small";
}) {
  const { pending } = useFormStatus();
  const label = active ? "お気に入りを解除" : "お気に入りに追加";

  return (
    <Button
      aria-label={label}
      className={
        fullWidth
          ? active
            ? "w-full gap-2 bg-[var(--ui-fg)] text-[var(--ui-bg)] hover:opacity-80"
            : "w-full gap-2"
          : active
            ? className
              ? `${className} text-[#e0aa00]`
              : "bg-[var(--ui-fg)] text-[var(--ui-bg)] hover:opacity-80"
            : className
      }
      disabled={pending}
      size={size}
      title={label}
      type="submit"
      variant="outline"
    >
      <StarIcon active={active && !pending} className={pending ? "opacity-45" : undefined} />
      {fullWidth ? <span>{active ? "お気に入り済み" : "お気に入り"}</span> : null}
    </Button>
  );
}
