import { cn } from "@/lib/utils";

function getReadableTextColor(color: string) {
  const normalized = color.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return "#101010";
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? "#101010" : "#ffffff";
}

export function TagChip({
  color,
  label,
  className,
}: {
  color?: string | null;
  label: string;
  className?: string;
}) {
  const hasColor = Boolean(color);
  const style = hasColor
    ? {
        backgroundColor: color ?? undefined,
        color: getReadableTextColor(color ?? ""),
      }
    : undefined;

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center justify-center border-2 border-[var(--ui-border)] px-2.5 text-[0.72rem] font-bold tracking-[0.08em]",
        hasColor
          ? "border-[var(--ui-border)]"
          : "bg-[var(--tag-neutral-bg)] text-[var(--tag-neutral-fg)]",
        className,
      )}
      style={style}
    >
      {label}
    </span>
  );
}
