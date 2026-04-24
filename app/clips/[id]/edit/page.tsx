import { notFound } from "next/navigation";

import { ClipForm } from "@/components/clips/clip-form";
import { updateClipAction } from "@/lib/actions/clips";
import { requireUser } from "@/lib/auth";
import { getClipById } from "@/lib/clips";
import { listTagsForUser } from "@/lib/tags";
import { getSignedClipImageUrl } from "@/lib/utils";

export default async function EditClipPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const clip = await getClipById(supabase, id, user.id);
  const tags = await listTagsForUser(supabase, user.id);

  if (!clip) {
    notFound();
  }

  const initialImagePreviewUrl = await getSignedClipImageUrl(
    supabase,
    clip.image_path,
  );

  return (
    <section className="grid min-h-[calc(100vh-120px)] gap-4 px-2 py-4 md:px-6 md:py-10">
      <ClipForm
        action={updateClipAction.bind(null, clip.id)}
        availableTags={tags}
        cancelHref={`/clips/${clip.id}`}
        description="本文、URL、メモ、タグを見直して、保存済みの記事を更新できます。"
        heading="EDIT CLIP"
        initialImagePreviewUrl={initialImagePreviewUrl}
        submitLabel="Update Clip"
        values={{
          body: clip.body ?? "",
          image_path: clip.image_path ?? "",
          memo: clip.memo ?? "",
          tagIds: clip.tags.map((tag) => tag.id),
          title: clip.title,
          url: clip.url ?? "",
        }}
      />
    </section>
  );
}
