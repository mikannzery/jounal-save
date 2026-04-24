"use client";

import { ExportDropdown } from "@/components/clips/export-dropdown";
import { buttonStyles } from "@/components/ui/button";
import { DownloadIcon } from "@/components/ui/icons";

export function ExportMenu({
  csvHref,
  jsonHref,
}: {
  csvHref: string;
  jsonHref: string;
}) {
  return (
    <ExportDropdown
      items={[
        { href: jsonHref, key: "json", label: "EXPORT JSON" },
        { href: csvHref, key: "csv", label: "EXPORT CSV" },
      ]}
      triggerClassName={buttonStyles({
        className: "min-h-12 min-w-[180px] gap-3 px-5 text-sm leading-none",
        size: "small",
        variant: "outline",
      })}
      triggerContent={
        <>
          <DownloadIcon />
          <span>EXPORT</span>
        </>
      }
      triggerLabel="Export"
    />
  );
}
