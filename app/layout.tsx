import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

export const metadata: Metadata = {
  description: "Personal article archive for reading, sorting, and revisiting.",
  title: "CLIP MEMO",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto w-full px-3 py-3 md:px-4 md:py-4">{children}</main>
      </body>
    </html>
  );
}
