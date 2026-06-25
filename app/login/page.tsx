import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { FormMessage } from "@/components/ui/field";
import { getOptionalUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ error?: string; next?: string }>;
}>) {
  if (!hasSupabaseEnv()) {
    redirect("/setup");
  }

  const user = await getOptionalUser();

  if (user) {
    redirect("/clips");
  }

  const { error, next } = await searchParams;

  return (
    <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
      <div className="grid gap-4">
        {error === "callback" ? (
          <FormMessage tone="error">認証リンクの確認に失敗しました。もう一度ログインしてください。</FormMessage>
        ) : null}
        <AuthForm next={next} />
      </div>
      <div className="grid gap-4 border-2 border-black bg-black p-6 text-white md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]">プライベートアーカイブ</p>
        <h2 className="text-3xl font-black leading-tight md:text-4xl">保存した記事はログイン中のユーザーだけが閲覧できます。</h2>
        <ul className="grid gap-3 text-sm leading-7 text-white/80">
          <li>すべての取得と更新はユーザーIDでスコープし、Supabase RLS を前提に保護します。</li>
          <li>作成、一覧、詳細、編集、アーカイブ、復元、完全削除までログイン後に利用できます。</li>
          <li>空状態、読み込み中、失敗時のメッセージを画面上で確認できます。</li>
        </ul>
      </div>
    </section>
  );
}
