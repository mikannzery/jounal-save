import { ArchivedClipCard } from "@/components/clips/archived-clip-card";
import { ClipBrowser } from "@/components/clips/clip-browser";
import { ExportMenu } from "@/components/clips/export-menu";
import { TagFilterBar } from "@/components/clips/tag-filter-bar";
import { requireUser } from "@/lib/auth";
import {
  buildExportHref,
  listArchivedClips,
  resolveClipSort,
  resolveClipView,
  resolveTagFilter,
} from "@/lib/clips";
import { listTagsWithUsage } from "@/lib/tags";

export const dynamic = "force-dynamic";

function ArchiveFeedback({
  error,
  status,
}: {
  error?: string;
  status?: string;
}) {
  if (status === "archived") {
    return (
      <div className="border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)] px-4 py-3 text-sm">
        記事をアーカイブへ移動しました。
      </div>
    );
  }

  if (status === "bulk_archived") {
    return (
      <div className="border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)] px-4 py-3 text-sm">
        選択した記事をアーカイブへ移動しました。
      </div>
    );
  }

  if (status === "restored") {
    return (
      <div className="border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)] px-4 py-3 text-sm">
        記事を一覧へ戻しました。
      </div>
    );
  }

  if (status === "deleted") {
    return (
      <div className="border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)] px-4 py-3 text-sm">
        記事を完全に削除しました。
      </div>
    );
  }

  if (error === "restore") {
    return (
      <div className="border-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">
        記事の復元に失敗しました。
      </div>
    );
  }

  if (error === "delete") {
    return (
      <div className="border-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">
        記事の完全削除に失敗しました。
      </div>
    );
  }

  return null;
}

export default async function ArchivePage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    error?: string;
    sort?: string | string[];
    status?: string;
    tag?: string | string[];
    view?: string | string[];
  }>;
}>) {
  const { error, sort: rawSort, status, tag: rawTag, view: rawView } =
    await searchParams;
  const { supabase, user } = await requireUser();
  const sort = resolveClipSort(rawSort);
  const tag = resolveTagFilter(rawTag);
  const view = resolveClipView(rawView);
  const [clips, tags] = await Promise.all([
    listArchivedClips(supabase, user.id, sort, tag),
    listTagsWithUsage(supabase, user.id),
  ]);
  const jsonExportHref = buildExportHref({
    format: "json",
    scope: "archive",
    sort,
    tag,
  });
  const csvExportHref = buildExportHref({
    format: "csv",
    scope: "archive",
    sort,
    tag,
  });

  return (
    <ClipBrowser
      basePath="/archive"
      contentHeader={
        <TagFilterBar
          activeTag={tag}
          basePath="/archive"
          sort={sort}
          tags={tags}
          view={view}
        />
      }
      count={clips.length}
      emptyDescription="アーカイブした記事がここに並びます。必要なら復元し、不要ならこの画面から完全削除できます。"
      emptyTitle="アーカイブは空です"
      feedback={<ArchiveFeedback error={error} status={status} />}
      heading="アーカイブ"
      label="[アーカイブ]"
      sort={sort}
      tag={tag}
      toolbarExtras={<ExportMenu csvHref={csvExportHref} jsonHref={jsonExportHref} />}
      view={view}
    >
      {clips.map((clip) => (
        <ArchivedClipCard clip={clip} key={clip.id} view={view} />
      ))}
    </ClipBrowser>
  );
}
