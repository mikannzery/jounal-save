"use client";

import type { MouseEvent } from "react";
import { useFormStatus } from "react-dom";

import { Button, type ButtonVariant } from "@/components/ui/button";

export function ConfirmSubmitButton({
  className,
  confirmMessage,
  idleLabel,
  pendingLabel,
  variant = "danger",
}: {
  className?: string;
  confirmMessage: string;
  idleLabel: string;
  pendingLabel: string;
  variant?: ButtonVariant;
}) {
  const { pending } = useFormStatus();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  }

  return (
    <Button
      className={className}
      disabled={pending}
      onClick={handleClick}
      type="submit"
      variant={variant}
    >
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
