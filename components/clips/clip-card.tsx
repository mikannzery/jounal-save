import Link from "next/link";

import { ClipExportButton } from "@/components/clips/clip-export-button";
import { FavoriteButton } from "@/components/clips/favorite-button";
import { buttonStyles } from "@/components/ui/button";
import { PencilIcon } from "@/components/ui/icons";
import { TagChip } from "@/components/ui/tag-chip";
import { setFavoriteClipAction } from "@/lib/actions/clips";
import { cn, formatDate, getDomainLabel, getExcerpt } from "@/lib/utils";
import type { ClipWithTags } from "@/types/clip";

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

export function ClipCard({
  clip,
  selectionFormId,
  selectionMode = false,
  view = "grid",
}: {
  clip: ClipWithTags;
  selectionFormId?: string;
  selectionMode?: boolean;
  view?: "grid" | "list";
}) {
  const domain = getDomainLabel(clip.url);
  const chips =
    clip.tags.length > 0
      ? clip.tags
      : ([
          clip.memo ? { color: null, name: "メモ" } : null,
          clip.body ? { color: null, name: "本文" } : null,
        ].filter(Boolean) as Array<{ color: string | null; name: string }>);
  const favoriteAction = setFavoriteClipAction.bind(null, clip.id, !clip.is_favorite);
  const iconClassName =
    "h-6 w-6 border-transparent bg-transparent px-0 text-[17px] leading-none tracking-normal text-[var(--ui-fg)] opacity-85 hover:border-transparent hover:bg-transparent hover:text-[var(--ui-fg)] hover:opacity-100";

  return (
    <article
      className={cn(
        "border-2 border-[var(--ui-border-soft)] bg-[var(--panel-bg)] px-6 py-6",
        view === "grid"
          ? "flex h-full w-full flex-col gap-5"
          : "grid w-full gap-6 md:grid-cols-[minmax(0,1fr)_170px] md:items-start",
      )}
    >
      <div className="grid flex-1 gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="grid min-w-0 gap-2">
            <h2
              className={cn(
                "text-[1.05rem] font-black leading-[1.45] tracking-[0.02em] md:text-[1.12rem]",
                view === "grid" ? "pr-0" : "pr-0",
              )}
              style={clampTitleStyle}
            >
              {clip.title}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              aria-label="編集"
              className={buttonStyles({
                className: iconClassName,
                size: "icon",
                variant: "outline",
              })}
              href={`/clips/${clip.id}/edit`}
              title="編集"
            >
              <PencilIcon />
            </Link>
            <ClipExportButton className={iconClassName} clip={clip} />
            <form action={favoriteAction}>
              <FavoriteButton active={clip.is_favorite} className={iconClassName} />
            </form>
          </div>
        </div>

        {selectionMode && selectionFormId ? (
          <label className="inline-flex w-fit items-center gap-2 text-xs font-semibold tracking-[0.1em] text-[var(--ui-muted)]">
            <input
              className="h-4 w-4 accent-[var(--ui-fg)]"
              form={selectionFormId}
              name="clipIds"
              type="checkbox"
              value={clip.id}
            />
            <span>選択</span>
          </label>
        ) : null}

        <div className="grid gap-2.5">
          <Link
            className="w-fit text-sm font-black tracking-[0.04em] underline underline-offset-4"
            href={`/clips/${clip.id}#ai-summary`}
          >
            要約を見る
          </Link>
          <p
            className="text-sm leading-[1.85] text-[var(--ui-muted)]"
            style={clampExcerptStyle}
          >
            {getExcerpt(clip.body || clip.memo, 120)}
          </p>
        </div>

        <div className="mt-auto grid gap-2.5 border-t-2 border-[var(--ui-border-soft)] pt-3">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--ui-muted)]">
            {formatDate(clip.created_at)}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.12em] text-[var(--ui-muted)]">
            <span>{domain ?? "URL未設定"}</span>
            {clip.url ? (
              <a className="underline" href={clip.url} rel="noreferrer" target="_blank">
                元URL
              </a>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {(chips.length > 0 ? chips : [{ color: null, name: "タグなし" }]).map((chip) => (
              <TagChip color={chip.color} key={chip.name} label={chip.name} />
            ))}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-3",
          view === "list"
            ? "md:content-start md:border-l-2 md:border-l-[var(--ui-border)] md:pl-4"
            : "",
        )}
      >
        <Link
          className={buttonStyles({ className: "w-full", size: "small", variant: "outline" })}
          href={`/clips/${clip.id}`}
        >
          詳細を見る
        </Link>
      </div>
    </article>
  );
}
