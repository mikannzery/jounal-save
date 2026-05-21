export default function Loading() {
  return (
    <div className="border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] p-8 text-[var(--panel-fg)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-muted)]">Loading</p>
      <p className="mt-3 text-sm text-[var(--panel-fg)]">読み込み中です...</p>
    </div>
  );
}
