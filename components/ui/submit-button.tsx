"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

interface SubmitButtonProps extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, "name" | "value"> {
  idleLabel: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function SubmitButton({ idleLabel, name, pendingLabel, value, variant = "primary" }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} name={name} type="submit" value={value} variant={variant}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
