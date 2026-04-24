import { buttonStyles } from "@/components/ui/button";
import { createTagAction, deleteTagAction, updateTagAction } from "@/lib/actions/tags";
import { requireUser } from "@/lib/auth";
import { listTagsWithUsage } from "@/lib/tags";

export const dynamic = "force-dynamic";

function TagFeedback({ error, status }: { error?: string; status?: string }) {
  if (status === "created") {
    return (
      <div className="border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)] px-4 py-3 text-sm text-[var(--panel-fg)]">
        タグを作成しました。
      </div>
    );
  }

  if (status === "updated") {
    return (
      <div className="border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)] px-4 py-3 text-sm text-[var(--panel-fg)]">
        タグを更新しました。
      </div>
    );
  }

  if (status === "deleted") {
    return (
      <div className="border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)] px-4 py-3 text-sm text-[var(--panel-fg)]">
        タグを削除しました。記事は残り、紐付けだけ解除されています。
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">
        タグの更新に失敗しました。
      </div>
    );
  }

  return null;
}

export default async function TagsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ error?: string; status?: string }>;
}>) {
  const { error, status } = await searchParams;
  const { supabase, user } = await requireUser();
  const tags = await listTagsWithUsage(supabase, user.id);

  return (
    <section className="border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] text-[var(--panel-fg)]">
      <div className="grid gap-5 border-b-2 border-[var(--ui-border-soft)] px-5 py-5 md:grid-cols-[1fr_360px] md:px-8 md:py-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-[0.12em] text-[var(--ui-muted)]">
            [タグ管理]
          </p>
          <h1 className="text-[2.7rem] font-bold uppercase leading-none tracking-[0.01em] text-[var(--panel-fg)] md:text-[3.6rem]">
            TAGS
          </h1>
        </div>

        <form action={createTagAction} className="grid gap-3 border-2 border-[var(--ui-border-soft)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--panel-fg)]">
            New Tag
          </p>
          <input
            className="min-h-12 border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] px-3 text-[var(--panel-fg)]"
            defaultValue="#111111"
            name="color"
            type="color"
          />
          <input
            className="min-h-12 border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] px-3 text-sm text-[var(--panel-fg)] placeholder:text-[var(--ui-muted)]"
            name="name"
            placeholder="タグ名"
            required
          />
          <button className={buttonStyles({ className: "w-full", variant: "primary" })} type="submit">
            作成する
          </button>
        </form>
      </div>

      <div className="grid gap-5 px-5 py-5 md:px-8 md:py-7">
        <TagFeedback error={error} status={status} />

        {tags.length === 0 ? (
          <div className="grid gap-4 border-2 border-dashed border-[var(--ui-border-soft)] p-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-muted)]">
              Empty
            </p>
            <p className="text-[2rem] font-bold uppercase text-[var(--panel-fg)]">
              No Tags Yet
            </p>
            <p className="text-sm leading-7 text-[var(--ui-muted)]">
              最初のタグをここで作成できます。タグを削除しても記事自体は削除されません。
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {tags.map((tag) => (
              <article className="grid gap-4 border-2 border-[var(--ui-border-soft)] p-5" key={tag.id}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-5 w-5 border-2 border-[var(--ui-border)]"
                      style={{ backgroundColor: tag.color ?? "#111111" }}
                    />
                    <p className="text-[1.8rem] font-bold text-[var(--panel-fg)]">
                      {tag.name}
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ui-muted)]">
                    {tag.usageCount} clips
                  </span>
                </div>

                <form
                  action={updateTagAction.bind(null, tag.id)}
                  className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_160px]"
                >
                  <input
                    className="min-h-12 border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] px-2 text-[var(--panel-fg)]"
                    defaultValue={tag.color ?? "#111111"}
                    name="color"
                    type="color"
                  />
                  <input
                    className="min-h-12 border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] px-3 text-sm text-[var(--panel-fg)]"
                    defaultValue={tag.name}
                    name="name"
                    required
                  />
                  <button className={buttonStyles({ className: "w-full", variant: "secondary" })} type="submit">
                    保存
                  </button>
                </form>

                <form action={deleteTagAction.bind(null, tag.id)}>
                  <button className={buttonStyles({ className: "w-full", variant: "danger" })} type="submit">
                    タグを削除
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
