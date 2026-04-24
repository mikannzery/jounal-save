"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

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
        aria-expanded={open}
        aria-haspopup="menu"
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
          role="menu"
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
                role="menuitem"
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
                role="menuitem"
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
