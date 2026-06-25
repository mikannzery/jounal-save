import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createTagAction, deleteTagAction, updateTagAction } from "@/lib/actions/tags";
import { requireUser } from "@/lib/auth";
import { listTagsWithUsage } from "@/lib/tags";

export const dynamic = "force-dynamic";

function TagsFeedback({ error, status }: { error?: string; status?: string }) {
  if (status === "created") {
    return <FormMessage tone="success">タグを作成しました。</FormMessage>;
  }

  if (status === "updated") {
    return <FormMessage tone="success">タグを更新しました。</FormMessage>;
  }

  if (status === "deleted") {
    return <FormMessage tone="success">タグを削除しました。</FormMessage>;
  }

  if (error) {
    return <FormMessage tone="error">タグの保存に失敗しました。</FormMessage>;
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
    <section className="grid gap-6 border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] p-5 text-[var(--panel-fg)] md:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-muted)]">[タグ管理]</p>
        <h1 className="text-[3.7rem] font-bold leading-none tracking-[0.01em] md:text-[4.75rem]">TAGS</h1>
      </div>

      <TagsFeedback error={error} status={status} />

      <form action={createTagAction} className="grid gap-4 border-2 border-[var(--ui-border-soft)] p-4 md:grid-cols-[1fr_140px_auto] md:items-end">
        <Field label="タグ名">
          <Input name="name" placeholder="読書" required />
        </Field>
        <Field label="色">
          <Input defaultValue="#111111" name="color" type="color" />
        </Field>
        <Button type="submit" variant="secondary">作成する</Button>
      </form>

      {tags.length === 0 ? (
        <div className="border-2 border-dashed border-[var(--ui-border)] p-8 text-center text-sm text-[var(--ui-muted)]">最初のタグを作成すると、ここに表示されます。</div>
      ) : (
        <div className="grid gap-4">
          {tags.map((tag) => (
            <div className="grid gap-4 border-2 border-[var(--ui-border-soft)] p-4 md:grid-cols-[1fr_auto] md:items-center" key={tag.id}>
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 border-2 border-[var(--ui-border)]" style={{ backgroundColor: tag.color ?? "#111111" }} />
                <div>
                  <p className="font-semibold">{tag.name}</p>
                  <p className="text-xs text-[var(--ui-muted)]">{tag.usageCount}件</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <form action={updateTagAction.bind(null, tag.id)} className="flex flex-wrap items-end gap-3">
                  <Input aria-label="タグ名" defaultValue={tag.name} name="name" required />
                  <Input aria-label="タグの色" defaultValue={tag.color ?? "#111111"} name="color" type="color" />
                  <Button type="submit" variant="outline">保存</Button>
                </form>
                <form action={deleteTagAction.bind(null, tag.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`「${tag.name}」タグを削除します。現在 ${tag.usageCount} 件の記事で使われています。削除しますか？`}
                    idleLabel="タグを削除"
                    pendingLabel="削除中..."
                  />
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
