import Link from "next/link";

import { HeaderLink } from "@/components/layout/header-link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button, buttonStyles } from "@/components/ui/button";
import { ExternalLinkIcon, PlusIcon } from "@/components/ui/icons";
import { logoutAction } from "@/lib/actions/auth";
import { getOptionalUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getOptionalUser();

  return (
    <header className="bg-[var(--header-bg)] text-[var(--header-fg)]">
      <div className="mx-auto grid w-full max-w-[1900px] gap-6 px-6 py-4 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-8 md:px-8">
        <div className="flex items-center">
          <Link
            className="inline-flex items-center text-[1.45rem] font-black tracking-[0.04em]"
            href="/"
          >
            CLIP MEMO
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 md:justify-start">
          <HeaderLink href="/clips" label="すべての記事" />
          <HeaderLink href="/favorites" label="お気に入り" />
          <HeaderLink href="/calendar" label="カレンダー" />
          <HeaderLink href="/archive" label="アーカイブ" />
          <HeaderLink href="/tags" label="タグ管理" />
        </nav>

        <div className="flex flex-wrap items-center gap-5 md:justify-end">
          {user ? (
            <>
              <Link
                className={buttonStyles({
                  className:
                    "header-new-button min-h-12 min-w-[128px] gap-2 px-7 text-sm font-black hover:bg-[#e9e9e4] hover:text-black",
                  size: "small",
                  variant: "inverse",
                })}
                href="/clips/new"
              >
                <PlusIcon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">新規</span>
              </Link>
              <ThemeToggle />
              <form action={logoutAction}>
                <Button
                  aria-label="ログアウト"
                  className="h-12 w-12 border-transparent bg-transparent text-white hover:border-white hover:bg-white hover:text-black"
                  size="icon"
                  title="ログアウト"
                  type="submit"
                  variant="ghost"
                >
                  <ExternalLinkIcon />
                </Button>
              </form>
            </>
          ) : (
            <Link
              className={buttonStyles({ size: "small", variant: "inverse" })}
              href="/login"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
