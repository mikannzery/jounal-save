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
      <p className="text-sm text-black/70">読み込みに失敗しました。再試行しても直らない場合は設定を見直してください。</p>
      <div>
        <Button onClick={reset} type="button">
          Retry
        </Button>
      </div>
    </div>
  );
}
