import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "filled"
  | "outline"
  | "inverse"
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "mono";
type ButtonSize = "default" | "small" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const baseClasses =
  "inline-flex items-center justify-center border-2 font-bold tracking-[0.14em] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-100";

const variantClasses: Record<ButtonVariant, string> = {
  danger:
    "border-[var(--ui-border)] bg-[var(--button-bg)] text-[var(--button-fg)] hover:bg-[var(--button-hover-bg)] hover:text-[var(--button-hover-fg)] disabled:border-[var(--button-disabled-border)] disabled:bg-[var(--button-disabled-bg)] disabled:text-[var(--button-disabled-fg)]",
  filled:
    "border-[var(--ui-fg)] bg-[var(--ui-fg)] text-[var(--ui-bg)] hover:opacity-80 disabled:border-[var(--button-disabled-border)] disabled:bg-[var(--button-disabled-bg)] disabled:text-[var(--button-disabled-fg)]",
  ghost:
    "border-transparent bg-transparent text-[var(--button-fg)] hover:border-[var(--ui-border)] hover:bg-[var(--button-hover-bg)] hover:text-[var(--button-hover-fg)] disabled:border-transparent disabled:bg-transparent disabled:text-[var(--button-disabled-fg)]",
  inverse:
    "border-white bg-white text-black hover:bg-[#e9e9e4] hover:text-black disabled:border-[#d1d1cb] disabled:bg-[#d1d1cb] disabled:text-[#666666]",
  mono:
    "border-[var(--ui-border)] bg-[var(--button-bg)] text-[var(--button-fg)] hover:bg-[var(--button-hover-bg)] hover:text-[var(--button-hover-fg)] disabled:border-[var(--button-disabled-border)] disabled:bg-[var(--button-disabled-bg)] disabled:text-[var(--button-disabled-fg)]",
  outline:
    "border-[var(--ui-border)] bg-[var(--button-bg)] text-[var(--button-fg)] hover:bg-[var(--button-hover-bg)] hover:text-[var(--button-hover-fg)] disabled:border-[var(--button-disabled-border)] disabled:bg-[var(--button-disabled-bg)] disabled:text-[var(--button-disabled-fg)]",
  primary:
    "border-[var(--ui-fg)] bg-[var(--ui-fg)] text-[var(--ui-bg)] hover:opacity-80 disabled:border-[var(--button-disabled-border)] disabled:bg-[var(--button-disabled-bg)] disabled:text-[var(--button-disabled-fg)]",
  secondary:
    "border-[var(--ui-border)] bg-[var(--button-bg)] text-[var(--button-fg)] hover:bg-[var(--button-hover-bg)] hover:text-[var(--button-hover-fg)] disabled:border-[var(--button-disabled-border)] disabled:bg-[var(--button-disabled-bg)] disabled:text-[var(--button-disabled-fg)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "min-h-12 px-5 text-sm",
  icon: "h-11 w-11 px-0 text-[18px]",
  small: "min-h-10 px-4 text-xs",
};

export function buttonStyles({
  className,
  size = "default",
  variant = "primary",
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return cn(baseClasses, sizeClasses[size], variantClasses[variant], className);
}

export function Button({
  children,
  className,
  size = "default",
  type = "button",
  variant = "primary",
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={buttonStyles({ className, size, variant })}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
