import { ClipForm } from "@/components/clips/clip-form";
import { createClipAction } from "@/lib/actions/clips";
import { requireUser } from "@/lib/auth";
import { listTagsForUser } from "@/lib/tags";

export default async function NewClipPage() {
  const { supabase, user } = await requireUser();
  const tags = await listTagsForUser(supabase, user.id);

  return (
    <section className="grid min-h-[calc(100vh-120px)] gap-4 px-2 py-4 md:px-6 md:py-10">
        <ClipForm
          action={createClipAction}
          availableTags={tags}
          allowInlineTagCreate
          cancelHref="/clips"
        description="手入力メモ、URL取得、画像アップロードや貼り付けを使って記事を保存できます。"
        heading="NEW CLIP"
        submitLabel="Save Clip"
        values={{
          body: "",
          image_path: "",
          memo: "",
          tagIds: [],
          title: "",
          url: "",
        }}
      />
    </section>
  );
}
