"use client";

import { ExportDropdown } from "@/components/clips/export-dropdown";
import { buttonStyles } from "@/components/ui/button";
import { DownloadIcon } from "@/components/ui/icons";

export function ClipExportButton({
  className,
  clipId,
}: {
  className?: string;
  clipId: string;
}) {
  const jsonExportHref = `/api/export?scope=clip&format=json&id=${encodeURIComponent(clipId)}`;
  const csvExportHref = `/api/export?scope=clip&format=csv&id=${encodeURIComponent(clipId)}`;

  return (
    <ExportDropdown
      items={[
        { href: jsonExportHref, key: "json", label: "JSONでエクスポート" },
        { href: csvExportHref, key: "csv", label: "CSVでエクスポート" },
      ]}
      menuWidthClassName="min-w-[180px]"
      triggerClassName={buttonStyles({
        className,
        size: "icon",
        variant: "outline",
      })}
      triggerContent={<DownloadIcon />}
      triggerLabel="エクスポート"
    />
  );
}
