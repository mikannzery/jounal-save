"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error("[app-error-boundary]", {
      digest: error.digest ?? null,
      message: error.message,
      name: error.name,
    });
  }, [error]);

  return (
    <div className="grid gap-6 border-2 border-black bg-white p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]">エラー</p>
        <h2 className="text-4xl font-black uppercase">問題が発生しました</h2>
      </div>
      <p className="text-sm text-[var(--ui-muted)]">予期しないエラーが発生しました。再読み込みしても解決しない場合は、時間をおいて再試行してください。</p>
      <div>
        <Button onClick={reset} type="button">
          再試行
        </Button>
      </div>
    </div>
  );
}
