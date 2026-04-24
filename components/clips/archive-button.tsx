"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function ArchiveButton({
  className,
  idleLabel = "Archive",
  pendingLabel = "Working...",
  variant = "outline",
}: {
  className?: string;
  idleLabel?: string;
  pendingLabel?: string;
  variant?: "filled" | "outline" | "inverse" | "danger" | "ghost" | "mono" | "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  return (
    <Button className={className} disabled={pending} type="submit" variant={variant}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
