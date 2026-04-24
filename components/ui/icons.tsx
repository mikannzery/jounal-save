import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

const baseClassName = "h-[18px] w-[18px] shrink-0";

export function PlusIcon({ className }: IconProps) {
  return (
    <svg aria-hidden className={cn(baseClassName, className)} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg aria-hidden className={cn(baseClassName, className)} fill="none" viewBox="0 0 24 24">
      <path
        d="M19.5 14.8A7.6 7.6 0 0 1 9.2 4.5 8 8 0 1 0 19.5 14.8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg aria-hidden className={cn(baseClassName, className)} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M12 2.8v2.4M12 18.8v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg aria-hidden className={cn(baseClassName, className)} fill="none" viewBox="0 0 24 24">
      <path
        d="M14 5h5v5M10 14 19 5M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg aria-hidden className={cn(baseClassName, className)} fill="none" viewBox="0 0 24 24">
      <path
        d="m4 20 4.2-1 9-9a1.8 1.8 0 0 0 0-2.6l-.6-.6a1.8 1.8 0 0 0-2.6 0l-9 9L4 20ZM13 7l4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg aria-hidden className={cn(baseClassName, className)} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 4v10M8.2 10.8 12 14.6l3.8-3.8M5 18.5h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <svg aria-hidden className={cn(baseClassName, className)} fill="none" viewBox="0 0 24 24">
      <path
        d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function ListIcon({ className }: IconProps) {
  return (
    <svg aria-hidden className={cn(baseClassName, className)} fill="none" viewBox="0 0 24 24">
      <path
        d="M8 7h11M8 12h11M8 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function StarIcon({
  active = false,
  className,
}: IconProps & { active?: boolean }) {
  return (
    <svg
      aria-hidden
      className={cn(baseClassName, className)}
      fill={active ? "currentColor" : "none"}
      viewBox="0 0 24 24"
    >
      <path
        d="m12 3.8 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8 2.5-5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}
