import Link from "next/link";

import { ArchiveButton } from "@/components/clips/archive-button";
import { TagChip } from "@/components/ui/tag-chip";
import { deleteClipAction, restoreClipAction } from "@/lib/actions/clips";
import type { ClipWithTags } from "@/types/clip";
import { cn, formatDate, getDomainLabel, getExcerpt } from "@/lib/utils";

const clampTitleStyle = {
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 3,
  display: "-webkit-box",
  overflow: "hidden",
};

const clampExcerptStyle = {
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 3,
  display: "-webkit-box",
  overflow: "hidden",
};

export function ArchivedClipCard({
  clip,
  view,
}: {
  clip: ClipWithTags;
  view: "grid" | "list";
}) {
  const restoreAction = restoreClipAction.bind(null, clip.id);
  const deleteAction = deleteClipAction.bind(null, clip.id);
  const domain = getDomainLabel(clip.url);

  return (
    <article
      className={cn(
        "border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] p-6",
        view === "grid"
          ? "flex h-full w-full max-w-[360px] flex-col gap-6"
          : "grid w-full gap-6 md:grid-cols-[minmax(0,1fr)_220px] md:items-start",
      )}
    >
      <div className="grid flex-1 gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="grid min-w-0 gap-2">
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--ui-muted)]">
              {formatDate(clip.updated_at)}
            </p>
            <Link
              className="text-base font-black leading-[1.45] tracking-[0.02em] md:text-[1.05rem]"
              href={`/clips/${clip.id}`}
              style={clampTitleStyle}
            >
              {clip.title}
            </Link>
          </div>
          <span className="inline-flex min-h-9 shrink-0 items-center justify-center border-2 border-[var(--ui-border)] px-3 text-[0.7rem] font-semibold tracking-[0.12em]">
            アーカイブ済み
          </span>
        </div>

        <p
          className="text-sm leading-7 text-[var(--ui-muted)]"
          style={clampExcerptStyle}
        >
          {getExcerpt(clip.body || clip.memo, 105)}
        </p>

        <div className="mt-auto grid gap-3 border-t-2 border-[var(--ui-border)] pt-3">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.12em] text-[var(--ui-muted)]">
            <span>{domain ?? "URL未設定"}</span>
            {clip.url ? (
              <a className="underline" href={clip.url} rel="noreferrer" target="_blank">
                元URL
              </a>
            ) : null}
          </div>

          {clip.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {clip.tags.map((tag) => (
                <TagChip color={tag.color} key={tag.id} label={tag.name} />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className={cn("grid gap-3", view === "list" ? "md:content-start" : "")}>
        <form action={restoreAction}>
          <ArchiveButton
            className="w-full"
            idleLabel="復元"
            pendingLabel="復元中..."
            variant="outline"
          />
        </form>
        <form action={deleteAction}>
          <ArchiveButton
            className="w-full"
            idleLabel="完全削除"
            pendingLabel="削除中..."
            variant="filled"
          />
        </form>
      </div>
    </article>
  );
}
