export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] p-8 text-[var(--panel-fg)]"
      role="status"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-muted)]">読み込み</p>
      <p className="mt-3 text-sm text-[var(--panel-fg)]">読み込み中です...</p>
    </div>
  );
}
