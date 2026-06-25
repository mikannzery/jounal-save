import Link from "next/link";
import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/env";

export default function SetupPage() {
  if (hasSupabaseEnv()) {
    redirect("/");
  }

  return (
    <section className="grid gap-6 border-2 border-black bg-white p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]">設定</p>
        <h1 className="text-4xl font-black uppercase leading-none md:text-5xl">Supabase 設定</h1>
      </div>
      <div className="grid gap-4 text-sm leading-7 text-black/75">
        <p>認証と記事保存を有効にするには、`.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定してください。</p>
        <p>本番のアカウント作成メールで callback URL を安定させたい場合は、任意で `SITE_URL` に公開URLを設定できます。</p>
        <p>Supabase SQL Editor で `supabase/schema.sql` を実行し、テーブル、RLS policy、画像アップロード用の `clip-images` bucket を作成してください。</p>
      </div>
      <div className="grid gap-3 border-2 border-black bg-stone-100 p-4 font-mono text-sm">
        <p>NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co</p>
        <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</p>
        <p>SITE_URL=https://your-app.example.com</p>
      </div>
      <Link className="text-sm font-semibold uppercase tracking-[0.18em] underline" href="/login">
        設定後にログインへ進む
      </Link>
    </section>
  );
}
