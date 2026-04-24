import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { buildClipBrowseHref, type ClipSort, type ClipView } from "@/lib/clips";
import type { TagWithCount } from "@/lib/tags";
import { cn } from "@/lib/utils";

export function TagFilterBar({
  activeTag,
  basePath,
  month,
  selectionMode = false,
  sort,
  tags,
  view,
  year,
}: {
  activeTag?: string;
  basePath: string;
  month?: number;
  selectionMode?: boolean;
  sort: ClipSort;
  tags: TagWithCount[];
  view: ClipView;
  year?: number;
}) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        className={buttonStyles({
          className: cn(
            "min-h-8 border-[var(--ui-border-soft)] px-4 text-[0.72rem]",
            !activeTag ? "active-control" : undefined,
          ),
          size: "small",
          variant: "outline",
        })}
        href={buildClipBrowseHref(basePath, {
          month,
          select: selectionMode,
          sort,
          view,
          year,
        })}
      >
        すべてのタグ
      </Link>
      {tags.map((tag) => (
        <Link
          className={buttonStyles({
            className: cn(
              "min-h-8 gap-2 border-[var(--ui-border-soft)] px-3.5 text-[0.72rem]",
              activeTag === tag.name ? "active-control" : undefined,
            ),
            size: "small",
            variant: "outline",
          })}
          href={buildClipBrowseHref(basePath, {
            month,
            select: selectionMode,
            sort,
            tag: tag.name,
            view,
            year,
          })}
          key={tag.id}
        >
          <span
            className="inline-block h-3.5 w-3.5 border border-[var(--ui-border)]"
            style={{ backgroundColor: tag.color ?? "var(--ui-fg)" }}
          />
          <span>{tag.name}</span>
          <span className="opacity-70">{tag.usageCount}</span>
        </Link>
      ))}
    </div>
  );
}
