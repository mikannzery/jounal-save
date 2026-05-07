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
    console.error(error);
  }, [error]);

  return (
    <div className="grid gap-6 border-2 border-black bg-white p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]">Error</p>
        <h2 className="text-4xl font-black uppercase">Something Broke</h2>
      </div>
      <p className="text-sm text-[var(--ui-muted)]">予期しないエラーが発生しました。再読み込みしても解決しない場合は、時間をおいて再試行してください。</p>
      <div>
        <Button onClick={reset} type="button">
          Retry
        </Button>
      </div>
    </div>
  );
}
