import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { buildClipBrowseHref } from "@/lib/clips";
import { requireUser } from "@/lib/auth";
import { listAllClipsForUser } from "@/lib/clips";

export const dynamic = "force-dynamic";

const monthLabels = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

export default async function CalendarPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ year?: string }>;
}>) {
  const { year } = await searchParams;
  const targetYear = Number(year) || new Date().getFullYear();
  const { supabase, user } = await requireUser();
  const clips = await listAllClipsForUser(supabase, user.id);
  const monthlyCounts = Array.from({ length: 12 }, (_, monthIndex) =>
    clips.filter((clip) => {
      const clipDate = new Date(clip.created_at);
      return clipDate.getFullYear() === targetYear && clipDate.getMonth() === monthIndex;
    }).length,
  );

  return (
    <section className="border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] px-5 py-5 text-[var(--panel-fg)] md:px-8 md:py-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-[3.7rem] font-bold leading-none tracking-[0.01em] text-[var(--panel-fg)] md:text-[4.75rem]">
            {targetYear}
          </h1>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--ui-muted)]">
            [MONTHLY ARCHIVE]
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            className={buttonStyles({ size: "icon", variant: "secondary" })}
            href={`/calendar?year=${targetYear - 1}`}
          >
            {"<"}
          </Link>
          <Link
            className={buttonStyles({ size: "icon", variant: "secondary" })}
            href={`/calendar?year=${targetYear + 1}`}
          >
            {">"}
          </Link>
        </div>
      </div>

      <div className="my-6 border-t-2 border-[var(--ui-border-soft)]" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {monthLabels.map((label, index) => {
          const href = buildClipBrowseHref("/clips", {
            month: index + 1,
            sort: "created_desc",
            view: "grid",
            year: targetYear,
          });

          return (
            <Link
              aria-label={`${targetYear}年${index + 1}月の記事一覧を表示`}
              className="group block border-2 border-[var(--ui-border-soft)] p-5 transition-colors hover:border-[var(--ui-border)] hover:bg-[var(--tag-neutral-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-fg)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-bg)]"
              href={href}
              key={label}
            >
              <div className="flex items-end justify-between gap-4">
                <p className="text-[2.6rem] font-bold leading-none tracking-[-0.01em] text-[var(--panel-fg)]">
                  {label}
                </p>
                <p className="text-sm font-semibold tracking-[0.16em] text-[var(--ui-muted)]">
                  {monthlyCounts[index]}件
                </p>
              </div>
              <div className="mt-6 border-t-2 border-[var(--ui-border-soft)] transition-colors group-hover:border-[var(--ui-border)]" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
