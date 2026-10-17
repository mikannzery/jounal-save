import Link from "next/link";
import type { ReactNode } from "react";

import { buttonStyles } from "@/components/ui/button";

type ExportDropdownItem = {
  href: string;
  key: string;
  label: string;
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
  return (
    <details className="relative group">
      <summary
        aria-label={triggerLabel}
        className={`${triggerClassName} list-none [&::-webkit-details-marker]:hidden`}
        title={triggerLabel}
      >
        {triggerContent}
      </summary>
      <div
        className={`absolute right-0 top-[calc(100%+10px)] z-20 hidden ${menuWidthClassName} gap-2 border-2 border-[var(--ui-border)] bg-[var(--panel-bg)] p-2 group-open:grid`}
      >
        {items.map((item) => (
          <Link
            className={buttonStyles({
              className: "w-full",
              size: "small",
              variant: "outline",
            })}
            href={item.href}
            key={item.key}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
