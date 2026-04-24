"use client";

import type { ClipWithTags } from "@/types/clip";

import { ExportDropdown } from "@/components/clips/export-dropdown";
import { buttonStyles } from "@/components/ui/button";
import { DownloadIcon } from "@/components/ui/icons";
import { buildClipExportPayload, buildClipExportRow, buildCsv } from "@/lib/clip-export";

function buildSafeFilename(title: string, extension: "csv" | "json") {
  return `${title || "clip"}.${extension}`.replace(/[\\/:*?"<>|]/g, "-");
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function ClipExportButton({
  className,
  clip,
}: {
  className?: string;
  clip: ClipWithTags;
}) {
  function handleJsonExport() {
    downloadBlob(
      new Blob([JSON.stringify(buildClipExportPayload(clip), null, 2)], {
        type: "application/json;charset=utf-8",
      }),
      buildSafeFilename(clip.title, "json"),
    );
  }

  function handleCsvExport() {
    downloadBlob(
      new Blob([`\uFEFF${buildCsv([buildClipExportRow(clip)])}`], {
        type: "text/csv;charset=utf-8",
      }),
      buildSafeFilename(clip.title, "csv"),
    );
  }

  return (
    <ExportDropdown
      items={[
        { key: "json", label: "EXPORT JSON", onSelect: handleJsonExport },
        { key: "csv", label: "EXPORT CSV", onSelect: handleCsvExport },
      ]}
      menuWidthClassName="min-w-[180px]"
      triggerClassName={buttonStyles({
        className,
        size: "icon",
        variant: "outline",
      })}
      triggerContent={<DownloadIcon />}
      triggerLabel="Export"
    />
  );
}
