"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function HeaderLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/clips" && pathname.startsWith(href));

  return (
    <Link
      className={cn(
        "inline-flex min-h-10 items-center justify-center border-b-2 border-transparent text-sm font-black tracking-[0.04em] text-[var(--header-muted)] transition hover:border-white hover:text-[var(--header-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black",
        isActive && "border-white text-[var(--header-fg)]",
      )}
      href={href}
    >
      {label}
    </Link>
  );
}
