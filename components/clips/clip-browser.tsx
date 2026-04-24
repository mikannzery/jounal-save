import Link from "next/link";
import type { ReactNode } from "react";

import { buttonStyles } from "@/components/ui/button";
import { GridIcon, ListIcon } from "@/components/ui/icons";
import {
  buildClipBrowseHref,
  clipSortOptions,
  type ClipSort,
  type ClipView,
} from "@/lib/clips";
import { cn } from "@/lib/utils";

export function ClipBrowser({
  basePath,
  children,
  contentHeader,
  count,
  emptyActionHref,
  emptyActionLabel,
  emptyDescription,
  emptyTitle,
  feedback,
  heading,
  label,
  month,
  selectionMode = false,
  sort,
  tag,
  toolbarExtras,
  view,
  year,
}: {
  basePath: string;
  children: ReactNode;
  contentHeader?: ReactNode;
  count: number;
  emptyActionHref?: string;
  emptyActionLabel?: string;
  emptyDescription: string;
  emptyTitle: string;
  feedback?: ReactNode;
  heading: string;
  label: string;
  month?: number;
  selectionMode?: boolean;
  sort: ClipSort;
  tag?: string;
  toolbarExtras?: ReactNode;
  view: ClipView;
  year?: number;
}) {
  return (
    <section className="-mx-3 -my-3 bg-[var(--panel-bg)] md:-mx-4 md:-my-4">
      <div className="grid gap-6 border-b-2 border-[var(--ui-border)] px-6 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-12 md:py-7">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold tracking-[0.14em] text-[var(--ui-muted)]">
            {label}
          </p>
          <h1 className="text-[2.25rem] font-bold leading-none tracking-[0.02em] md:text-[2.25rem]">
            {heading}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:justify-end md:gap-5">
          <div className="flex border-2 border-[var(--ui-border)]">
            <Link
              aria-label="カード表示"
              className={buttonStyles({
                className: cn(
                  "h-12 w-12 border-0 border-r-2 border-[var(--ui-border)] px-0 text-[18px] tracking-normal",
                  view === "grid" ? "active-control" : undefined,
                ),
                size: "small",
                variant: "outline",
              })}
              href={buildClipBrowseHref(basePath, {
                month,
                select: selectionMode,
                sort,
                tag,
                view: "grid",
                year,
              })}
              title="カード表示"
            >
              <GridIcon />
            </Link>
            <Link
              aria-label="リスト表示"
              className={buttonStyles({
                className: cn(
                  "h-12 w-12 border-0 px-0 text-[18px] tracking-normal",
                  view === "list" ? "active-control" : undefined,
                ),
                size: "small",
                variant: "outline",
              })}
              href={buildClipBrowseHref(basePath, {
                month,
                select: selectionMode,
                sort,
                tag,
                view: "list",
                year,
              })}
              title="リスト表示"
            >
              <ListIcon />
            </Link>
          </div>

          {toolbarExtras}

          <div className="grid min-w-16 justify-items-end gap-0.5 px-1">
            <span className="text-[2.1rem] font-semibold leading-none">{count}</span>
            <span className="text-[0.66rem] font-medium tracking-[0.18em] text-[var(--ui-muted)]">
              件
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 border-b-2 border-[var(--ui-border)] px-6 py-4 md:px-12">
        {clipSortOptions.map((option) => (
          <Link
            className={buttonStyles({
              className: cn(
                "min-h-9 min-w-[112px] border-[var(--ui-border-soft)] px-4 text-[0.76rem]",
                sort === option.value ? "active-control" : undefined,
              ),
              size: "small",
              variant: "outline",
            })}
            href={buildClipBrowseHref(basePath, {
              month,
              select: selectionMode,
              sort: option.value,
              tag,
              view,
              year,
            })}
            key={option.value}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-7 px-6 py-7 md:px-12 md:py-8">
        {feedback}
        {contentHeader}
        {count === 0 ? (
          <div className="grid gap-5 border-2 border-dashed border-[var(--ui-border)] p-10 text-center">
            <p className="text-xs font-semibold tracking-[0.24em] text-[var(--ui-muted)]">
              空
            </p>
            <p className="text-4xl font-black">{emptyTitle}</p>
            <p className="mx-auto max-w-[44ch] text-sm leading-7 text-[var(--ui-muted)]">
              {emptyDescription}
            </p>
            {emptyActionHref && emptyActionLabel ? (
              <div className="flex justify-center">
                <Link
                  className={buttonStyles({ variant: "outline" })}
                  href={emptyActionHref}
                >
                  {emptyActionLabel}
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <div
            className={cn(
              "gap-8",
              view === "grid"
                ? "grid md:grid-cols-2 lg:grid-cols-3"
                : "grid",
            )}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
