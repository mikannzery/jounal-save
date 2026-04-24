import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getOptionalUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ next?: string }>;
}>) {
  if (!hasSupabaseEnv()) {
    redirect("/setup");
  }

  const user = await getOptionalUser();

  if (user) {
    redirect("/clips");
  }

  const { next } = await searchParams;

  return (
    <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
      <AuthForm next={next} />
      <div className="grid gap-4 border-2 border-black bg-black p-6 text-white md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]">Private Archive</p>
        <h2 className="text-3xl font-black uppercase leading-tight md:text-4xl">Only signed-in users can access saved clips.</h2>
        <ul className="grid gap-3 text-sm leading-7 text-white/80">
          <li>Every query is scoped by user id and backed by Supabase RLS.</li>
          <li>STEP1 now includes auth, create, list, detail, edit, archive, restore, and hard delete.</li>
          <li>Empty states, loading states, and failure messages are visible in the UI.</li>
        </ul>
      </div>
    </section>
  );
}
