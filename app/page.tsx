import { redirect } from "next/navigation";

import { getOptionalUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export default async function HomePage() {
  if (!hasSupabaseEnv()) {
    redirect("/setup");
  }

  const user = await getOptionalUser();
  redirect(user ? "/clips" : "/login");
}
