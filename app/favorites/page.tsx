import Link from "next/link";

import { ClipBrowser } from "@/components/clips/clip-browser";
import { ClipCard } from "@/components/clips/clip-card";
import { ExportMenu } from "@/components/clips/export-menu";
import { TagFilterBar } from "@/components/clips/tag-filter-bar";
import { Button, buttonStyles } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { bulkArchiveClipsAction } from "@/lib/actions/clips";
import { requireUser } from "@/lib/auth";
import { buildClipBrowseHref, buildExportHref, listFavoriteClipsPage, resolveClipPage, resolveClipSort, resolveClipView, resolveSelectionMode, resolveTagFilter } from "@/lib/clips";
import { listTagsWithUsage } from "@/lib/tags";

export const dynamic = "force-dynamic";

function FavoritesFeedback({ error }: { error?: string }) {
  if (error === "bulk_archive") {
    return <FormMessage tone="error">一括アーカイブに失敗しました。もう一度試してください。</FormMessage>;
  }

  return null;
}

export default async function FavoritesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    error?: string;
    page?: string | string[];
    select?: string | string[];
    sort?: string | string[];
    tag?: string | string[];
    view?: string | string[];
  }>;
}>) {
  const { error, page: rawPage, select: rawSelect, sort: rawSort, tag: rawTag, view: rawView } = await searchParams;
  const { supabase, user } = await requireUser();
  const sort = resolveClipSort(rawSort);
  const tag = resolveTagFilter(rawTag);
  const view = resolveClipView(rawView);
  const selectionMode = resolveSelectionMode(rawSelect);
  const page = resolveClipPage(rawPage);
  const [clipPage, tags] = await Promise.all([
    listFavoriteClipsPage(supabase, user.id, sort, page, tag),
    listTagsWithUsage(supabase, user.id),
  ]);
  const selectionHref = buildClipBrowseHref("/favorites", { page, select: true, sort, tag, view });
  const browseHref = buildClipBrowseHref("/favorites", { page, sort, tag, view });
  const selectionFormId = "favorites-bulk-archive-form";
  const jsonExportHref = buildExportHref({ format: "json", scope: "favorites", sort, tag });
  const csvExportHref = buildExportHref({ format: "csv", scope: "favorites", sort, tag });

  return (
    <ClipBrowser
      basePath="/favorites"
      contentHeader={
        <>
          <TagFilterBar activeTag={tag} basePath="/favorites" selectionMode={selectionMode} sort={sort} tags={tags} view={view} />
          {selectionMode ? (
            <form action={bulkArchiveClipsAction} className="flex flex-wrap items-center gap-4 border-2 border-[var(--ui-border)] p-4" id={selectionFormId}>
              <input name="returnTo" type="hidden" value={selectionHref} />
              <Button type="submit" variant="outline">選択した記事をアーカイブ</Button>
              <Link className={buttonStyles({ variant: "outline" })} href={browseHref}>キャンセル</Link>
              <p className="text-sm text-[var(--ui-muted)]">お気に入り記事の中から、まとめてアーカイブしたいものを選べます。</p>
            </form>
          ) : null}
        </>
      }
      count={clipPage.totalCount}
      emptyDescription="気になった記事をお気に入りに追加すると、ここにまとまって表示されます。"
      emptyTitle="お気に入りはまだありません"
      feedback={<FavoritesFeedback error={error} />}
      heading="お気に入り"
      label="[お気に入り]"
      page={clipPage.page}
      pagination={clipPage}
      selectionMode={selectionMode}
      sort={sort}
      tag={tag}
      toolbarExtras={
        <>
          <ExportMenu csvHref={csvExportHref} jsonHref={jsonExportHref} />
          <Link
            className={buttonStyles({
              className: selectionMode ? "active-control min-h-12 min-w-[96px] px-5 text-sm leading-none" : "min-h-12 min-w-[96px] px-5 text-sm leading-none",
              size: "small",
              variant: "outline",
            })}
            href={selectionMode ? browseHref : selectionHref}
          >
            {selectionMode ? "選択中" : "選択"}
          </Link>
          {clipPage.totalCount > 0 ? (
            <Link className={buttonStyles({ size: "small", variant: "outline" })} href="/clips">一覧へ戻る</Link>
          ) : null}
        </>
      }
      view={view}
    >
      {clipPage.clips.map((clip) => (
        <ClipCard clip={clip} key={clip.id} selectionFormId={selectionMode ? selectionFormId : undefined} selectionMode={selectionMode} view={view} />
      ))}
    </ClipBrowser>
  );
}
