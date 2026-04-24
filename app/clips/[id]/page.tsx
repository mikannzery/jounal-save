import Link from "next/link";
import { notFound } from "next/navigation";

import { AiSummarySection } from "@/components/clips/ai-summary-section";
import { ArchiveButton } from "@/components/clips/archive-button";
import { FavoriteButton } from "@/components/clips/favorite-button";
import { buttonStyles } from "@/components/ui/button";
import { TagChip } from "@/components/ui/tag-chip";
import { archiveClipAction, generateAiSummaryAction, setFavoriteClipAction } from "@/lib/actions/clips";
import { requireUser } from "@/lib/auth";
import { getClipById } from "@/lib/clips";
import { hasGeminiApiKey } from "@/lib/env";
import { formatDate, getDomainLabel, getSignedClipImageUrl } from "@/lib/utils";

export default async function ClipDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
}>) {
  const { id } = await params;
  const { error, status } = await searchParams;
  const { supabase, user } = await requireUser();
  const clip = await getClipById(supabase, id, user.id);

  if (!clip) {
    notFound();
  }

  const archiveAction = archiveClipAction.bind(null, clip.id);
  const favoriteAction = setFavoriteClipAction.bind(null, clip.id, !clip.is_favorite);
  const summaryAction = generateAiSummaryAction.bind(null, clip.id);
  const domain = getDomainLabel(clip.url);
  const imageUrl = await getSignedClipImageUrl(supabase, clip.image_path);
  const canGenerateSummary = hasGeminiApiKey();

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link className="text-sm font-semibold uppercase tracking-[0.18em] underline text-[var(--ui-fg)]" href="/clips">
          記事一覧へ戻る
        </Link>
      </div>

      {status === "created" ? <div className="border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)] px-4 py-3 text-sm text-[var(--ui-fg)]">記事を作成しました。</div> : null}
      {status === "updated" ? <div className="border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)] px-4 py-3 text-sm text-[var(--ui-fg)]">記事を更新しました。</div> : null}
      {error === "archive" ? <div className="border-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">記事のアーカイブに失敗しました。</div> : null}

      <article className="grid gap-8 border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] p-6 text-[var(--panel-fg)] md:p-8">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-muted)]">{clip.is_archived ? "アーカイブ済み" : "記事詳細"}</p>
            <h1 className="text-3xl font-black leading-tight text-[var(--panel-fg)] md:text-5xl">{clip.title}</h1>
            <Link
              className={buttonStyles({ size: "small", variant: "outline" })}
              href={`/clips/${clip.id}/edit`}
            >
              編集
            </Link>
          </div>
          <div className="grid gap-3">
            <form action={favoriteAction}>
              <FavoriteButton active={clip.is_favorite} fullWidth size="default" />
            </form>
            <form action={archiveAction}>
              <ArchiveButton idleLabel="アーカイブ" pendingLabel="アーカイブ中..." />
            </form>
          </div>
        </div>

        {imageUrl ? (
          <div className="overflow-hidden border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="max-h-[28rem] w-full object-cover" src={imageUrl} />
          </div>
        ) : (
          <div className="flex min-h-56 items-center justify-center border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)] text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-muted)]">
            画像なし
          </div>
        )}

        <dl className="grid gap-4 border-y-2 border-dashed border-[var(--ui-border)] py-5 text-sm text-[var(--panel-fg)] md:grid-cols-3">
          <div className="space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ui-muted)]">作成日</dt>
            <dd>{formatDate(clip.created_at)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ui-muted)]">更新日</dt>
            <dd>{formatDate(clip.updated_at)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ui-muted)]">ドメイン</dt>
            <dd>{domain ?? "手入力"}</dd>
          </div>
        </dl>

        {clip.tags.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ui-muted)]">タグ</p>
            <div className="flex flex-wrap gap-2">
              {clip.tags.map((tag) => (
                <TagChip color={tag.color} key={tag.id} label={tag.name} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-6">
          {clip.url ? (
            <section className="max-w-5xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ui-muted)]">元URL</p>
              <a className="break-all text-sm text-[var(--panel-fg)] underline underline-offset-4" href={clip.url} rel="noreferrer" target="_blank">
                {clip.url}
              </a>
            </section>
          ) : null}

          <section className="grid max-w-5xl gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ui-muted)]">本文</p>
            <div className="min-h-64 border-2 border-[var(--ui-border)] p-5 whitespace-pre-wrap leading-7 text-[var(--panel-fg)] lg:p-6">
              {clip.body || "本文はまだ保存されていません。"}
            </div>
          </section>

          {clip.memo ? (
            <section className="grid max-w-4xl gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ui-muted)]">メモ</p>
              <div className="min-h-32 border-2 border-[var(--ui-border)] p-5 whitespace-pre-wrap leading-7 text-[var(--panel-fg)]">{clip.memo}</div>
            </section>
          ) : (
            <section className="grid max-w-4xl gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ui-muted)]">メモ</p>
              <div className="border-2 border-dashed border-[var(--ui-border-soft)] p-5 text-sm text-[var(--ui-muted)]">
                メモはまだありません。
              </div>
            </section>
          )}

          <AiSummarySection
            action={summaryAction}
            hasApiKey={canGenerateSummary}
            initialSummary={clip.ai_summary}
            initialUpdatedAt={clip.ai_summary_updated_at}
          />
        </div>
      </article>
    </section>
  );
}
