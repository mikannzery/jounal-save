"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { buttonStyles } from "@/components/ui/button";

type ExportDropdownItem =
  | {
      href: string;
      key: string;
      label: string;
    }
  | {
      key: string;
      label: string;
      onSelect: () => void;
    };

export function ExportDropdown({
  items,
  menuWidthClassName = "min-w-[220px]",
  triggerClassName,
  triggerContent,
  triggerLabel,
}: {
  items: ExportDropdownItem[];
  menuWidthClassName?: string;
  triggerClassName: string;
  triggerContent: ReactNode;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls={open ? popoverId : undefined}
        aria-expanded={open}
        aria-label={triggerLabel}
        className={triggerClassName}
        onClick={() => setOpen((current) => !current)}
        title={triggerLabel}
        type="button"
      >
        {triggerContent}
      </button>

      {open ? (
        <div
          className={`absolute right-0 top-[calc(100%+10px)] z-20 grid ${menuWidthClassName} gap-2 border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] p-2`}
          id={popoverId}
        >
          {items.map((item) =>
            "href" in item ? (
              <Link
                className={buttonStyles({
                  className: "w-full",
                  size: "small",
                  variant: "outline",
                })}
                href={item.href}
                key={item.key}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <button
                className={buttonStyles({
                  className: "w-full",
                  size: "small",
                  variant: "outline",
                })}
                key={item.key}
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
                type="button"
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
