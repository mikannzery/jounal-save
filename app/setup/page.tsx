import Link from "next/link";
import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/env";

export default function SetupPage() {
  if (hasSupabaseEnv()) {
    redirect("/");
  }

  return (
    <section className="grid gap-6 border-2 border-black bg-white p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]">Setup</p>
        <h1 className="text-4xl font-black uppercase leading-none md:text-5xl">Configure Supabase</h1>
      </div>
      <div className="grid gap-4 text-sm leading-7 text-black/75">
        <p>Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` to enable auth and CRUD.</p>
        <p>Run `supabase/schema.sql` in the Supabase SQL editor to create the tables, row-level security policies, and the `clip-images` storage bucket used for uploads.</p>
      </div>
      <div className="grid gap-3 border-2 border-black bg-stone-100 p-4 font-mono text-sm">
        <p>NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co</p>
        <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</p>
      </div>
      <Link className="text-sm font-semibold uppercase tracking-[0.18em] underline" href="/login">
        Continue to login after setup
      </Link>
    </section>
  );
}
