import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid gap-4 border-2 border-black bg-white p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em]">Not Found</p>
      <h2 className="text-4xl font-black uppercase">Clip Not Found</h2>
      <p className="text-sm text-black/70">対象の記事が見つからないか、アクセス権がありません。</p>
      <Link className="text-sm font-semibold uppercase tracking-[0.18em] underline" href="/clips">
        一覧へ戻る
      </Link>
    </div>
  );
}
