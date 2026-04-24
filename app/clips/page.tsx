import Link from "next/link";

import { ClipBrowser } from "@/components/clips/clip-browser";
import { ClipCard } from "@/components/clips/clip-card";
import { ExportMenu } from "@/components/clips/export-menu";
import { TagFilterBar } from "@/components/clips/tag-filter-bar";
import { Button, buttonStyles } from "@/components/ui/button";
import { bulkArchiveClipsAction } from "@/lib/actions/clips";
import { requireUser } from "@/lib/auth";
import {
  buildClipBrowseHref,
  buildExportHref,
  listClips,
  resolveClipMonthFilter,
  resolveClipSort,
  resolveClipView,
  resolveSelectionMode,
  resolveTagFilter,
} from "@/lib/clips";
import { listTagsWithUsage } from "@/lib/tags";

export const dynamic = "force-dynamic";

function ClipsFeedback({ error }: { error?: string }) {
  if (error === "bulk_archive") {
    return (
      <div className="border-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">
        一括アーカイブに失敗しました。もう一度試してください。
      </div>
    );
  }

  return null;
}

export default async function ClipsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    error?: string;
    month?: string | string[];
    select?: string | string[];
    sort?: string | string[];
    tag?: string | string[];
    view?: string | string[];
    year?: string | string[];
  }>;
}>) {
  const {
    error,
    month: rawMonth,
    select: rawSelect,
    sort: rawSort,
    tag: rawTag,
    view: rawView,
    year: rawYear,
  } = await searchParams;
  const { supabase, user } = await requireUser();
  const sort = resolveClipSort(rawSort);
  const tag = resolveTagFilter(rawTag);
  const view = resolveClipView(rawView);
  const selectionMode = resolveSelectionMode(rawSelect);
  const monthFilter = resolveClipMonthFilter(rawYear, rawMonth);
  const [clips, tags] = await Promise.all([
    listClips(supabase, user.id, sort, tag, monthFilter),
    listTagsWithUsage(supabase, user.id),
  ]);

  const selectionHref = buildClipBrowseHref("/clips", {
    month: monthFilter?.month,
    select: true,
    sort,
    tag,
    view,
    year: monthFilter?.year,
  });
  const browseHref = buildClipBrowseHref("/clips", {
    month: monthFilter?.month,
    sort,
    tag,
    view,
    year: monthFilter?.year,
  });
  const clearMonthHref = buildClipBrowseHref("/clips", {
    select: selectionMode,
    sort,
    tag,
    view,
  });
  const selectionFormId = "clips-bulk-archive-form";
  const jsonExportHref = buildExportHref({
    format: "json",
    month: monthFilter?.month,
    scope: "clips",
    sort,
    tag,
    year: monthFilter?.year,
  });
  const csvExportHref = buildExportHref({
    format: "csv",
    month: monthFilter?.month,
    scope: "clips",
    sort,
    tag,
    year: monthFilter?.year,
  });

  const monthLabel = monthFilter
    ? `${monthFilter.year}年${monthFilter.month}月の記事`
    : "すべての記事";
  const emptyTitle = monthFilter
    ? "この月の記事はまだありません"
    : "まだ記事がありません";
  const emptyDescription = monthFilter
    ? `${monthFilter.year}年${monthFilter.month}月に作成した記事はまだありません。別の月を選ぶか、新しく記事を作成してください。`
    : "メモやURLから記事を保存して、あとで読むためのアーカイブをここから作成できます。";

  return (
    <ClipBrowser
      basePath="/clips"
      contentHeader={
        <>
          {monthFilter ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-[var(--ui-border-soft)] bg-[var(--tag-neutral-bg)] px-4 py-3">
              <div className="grid gap-1">
                <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-[var(--ui-muted)]">
                  MONTH FILTER
                </p>
                <p className="text-sm font-semibold text-[var(--panel-fg)]">
                  [{monthLabel}]
                </p>
              </div>
              <Link
                className={buttonStyles({ size: "small", variant: "outline" })}
                href={clearMonthHref}
              >
                月フィルタを解除
              </Link>
            </div>
          ) : null}

          <TagFilterBar
            activeTag={tag}
            basePath="/clips"
            month={monthFilter?.month}
            selectionMode={selectionMode}
            sort={sort}
            tags={tags}
            view={view}
            year={monthFilter?.year}
          />

          {selectionMode ? (
            <form
              action={bulkArchiveClipsAction}
              className="flex flex-wrap items-center gap-4 border-2 border-[var(--ui-border)] p-4"
              id={selectionFormId}
            >
              <input name="returnTo" type="hidden" value={selectionHref} />
              <Button type="submit" variant="outline">
                選択した記事をアーカイブ
              </Button>
              <Link className={buttonStyles({ variant: "outline" })} href={browseHref}>
                キャンセル
              </Link>
              <p className="text-sm text-[var(--ui-muted)]">
                一括でアーカイブしたい記事にチェックを入れてください。
              </p>
            </form>
          ) : null}
        </>
      }
      count={clips.length}
      emptyActionHref="/clips/new"
      emptyActionLabel="最初の記事を作成"
      emptyDescription={emptyDescription}
      emptyTitle={emptyTitle}
      feedback={<ClipsFeedback error={error} />}
      heading="ALL CLIPS"
      label={`[${monthLabel}]`}
      month={monthFilter?.month}
      selectionMode={selectionMode}
      sort={sort}
      tag={tag}
      toolbarExtras={
        <>
          <ExportMenu csvHref={csvExportHref} jsonHref={jsonExportHref} />
          <Link
            className={buttonStyles({
              className: selectionMode
                ? "active-control min-h-12 min-w-[96px] px-5 text-sm leading-none"
                : "min-h-12 min-w-[96px] px-5 text-sm leading-none",
              size: "small",
              variant: "outline",
            })}
            href={selectionMode ? browseHref : selectionHref}
          >
            {selectionMode ? "選択中" : "選択"}
          </Link>
        </>
      }
      view={view}
      year={monthFilter?.year}
    >
      {clips.map((clip) => (
        <ClipCard
          clip={clip}
          key={clip.id}
          selectionFormId={selectionMode ? selectionFormId : undefined}
          selectionMode={selectionMode}
          view={view}
        />
      ))}
    </ClipBrowser>
  );
}
