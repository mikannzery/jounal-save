"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_CLIP_IMAGE_SIZE } from "@/lib/clip-constraints";
import { initialActionState } from "@/types/clip";
import type { ActionState, ClipFormValues, TagSummary } from "@/types/clip";

interface ClipFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  availableTags: TagSummary[];
  allowInlineTagCreate?: boolean;
  cancelHref: string;
  description: string;
  heading: string;
  initialImagePreviewUrl?: string | null;
  submitLabel: string;
  values: ClipFormValues;
}

function getTagTextColor(backgroundColor?: string | null) {
  if (!backgroundColor) {
    return "var(--panel-fg)";
  }

  const normalized = backgroundColor.trim();
  const hex = normalized.startsWith("#") ? normalized.slice(1) : normalized;

  if (![3, 6].includes(hex.length)) {
    return "var(--panel-fg)";
  }

  const expanded = hex.length === 3
    ? hex.split("").map((char) => `${char}${char}`).join("")
    : hex;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return "var(--panel-fg)";
  }

  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.62 ? "#101010" : "#f6f5ef";
}

export function ClipForm({
  action,
  availableTags,
  allowInlineTagCreate = false,
  cancelHref,
  description,
  heading,
  initialImagePreviewUrl = null,
  submitLabel,
  values,
}: ClipFormProps) {
  const [state, formAction] = useActionState(action, initialActionState);
  const [title, setTitle] = useState(values.title);
  const [url, setUrl] = useState(values.url);
  const [body, setBody] = useState(values.body);
  const [fetchState, setFetchState] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [imageState, setImageState] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(() => initialImagePreviewUrl);
  const [imageLabel, setImageLabel] = useState(values.image_path ? "現在の画像" : "");
  const [selectedTagIds, setSelectedTagIds] = useState(values.tagIds);
  const [tagOptions, setTagOptions] = useState(availableTags);
  const [isTagCreateOpen, setIsTagCreateOpen] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagCreateMessage, setTagCreateMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const latestUrlRef = useRef(values.url);
  const titleFetchIdRef = useRef(0);
  const contentFetchIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function applyFetchedTitle(nextTitle: string) {
    if (!nextTitle.trim()) {
      return false;
    }

    if (!title.trim()) {
      setTitle(nextTitle);
      return true;
    }

    const shouldReplace = window.confirm("タイトルがすでに入力されています。取得したタイトルで置き換えますか？");

    if (shouldReplace) {
      setTitle(nextTitle);
      return true;
    }

    return false;
  }

  function applyFetchedBody(nextBody: string) {
    if (!nextBody.trim()) {
      return false;
    }

    if (!body.trim()) {
      setBody(nextBody);
      return true;
    }

    const shouldReplace = window.confirm("本文がすでに入力されています。取得した本文で置き換えますか？");

    if (shouldReplace) {
      setBody(nextBody);
      return true;
    }

    return false;
  }

  function getFetchContentErrorMessage(status: number, fallbackMessage?: string) {
    if (status === 400) {
      return fallbackMessage ?? "本文を取得する前に有効なURLを入力してください。";
    }

    if (status === 422) {
      return "このページは読み取り可能な記事ではない可能性があります。トップページや商品ページではなく、記事ページのURLを試してください。";
    }

    if (status === 502) {
      return "ページを取得できませんでした。サイト側で自動アクセスを制限しているか、JavaScript が必要な可能性があります。";
    }

    return fallbackMessage ?? "ページ本文の取得に失敗しました。";
  }

  function handleUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextUrl = event.target.value;
    latestUrlRef.current = nextUrl;
    setUrl(nextUrl);
  }

  function isStaleFetch(requestUrl: string, requestId: number, currentRequestId: number) {
    return requestId !== currentRequestId || requestUrl !== latestUrlRef.current.trim();
  }

  function sortTagRows(rows: TagSummary[]) {
    return [...rows].sort((left, right) => left.name.localeCompare(right.name, "ja"));
  }

  function toggleTagSelection(tagId: string) {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((value) => value !== tagId)
        : [...current, tagId],
    );
  }

  async function handleCreateTag() {
    const trimmedName = newTagName.trim();

    if (!trimmedName) {
      setTagCreateMessage({
        text: "タグ名を入力してください。",
        tone: "error",
      });
      return;
    }

    const existingTag = tagOptions.find(
      (tag) => tag.name.trim().toLocaleLowerCase("ja-JP") === trimmedName.toLocaleLowerCase("ja-JP"),
    );

    if (existingTag) {
      setSelectedTagIds((current) => (current.includes(existingTag.id) ? current : [...current, existingTag.id]));
      setIsTagCreateOpen(false);
      setNewTagName("");
      setTagCreateMessage(null);
      return;
    }

    setIsCreatingTag(true);
    setTagCreateMessage(null);

    try {
      const response = await fetch("/api/tags", {
        body: JSON.stringify({ name: trimmedName }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as {
        error?: string;
        tag?: TagSummary;
      };

      if (!response.ok || !payload.tag) {
        setTagCreateMessage({
          text: payload.error ?? "タグの作成に失敗しました。",
          tone: "error",
        });
        return;
      }

      const createdTag = payload.tag;

      setTagOptions((current) => {
        if (current.some((tag) => tag.id === createdTag.id)) {
          return current;
        }

        return sortTagRows([...current, createdTag]);
      });
      setSelectedTagIds((current) => (current.includes(createdTag.id) ? current : [...current, createdTag.id]));
      setIsTagCreateOpen(false);
      setNewTagName("");
      setTagCreateMessage(null);
    } catch {
      setTagCreateMessage({
        text: "タグの作成に失敗しました。",
        tone: "error",
      });
    } finally {
      setIsCreatingTag(false);
    }
  }

  function syncInputFile(file: File) {
    if (!fileInputRef.current) {
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInputRef.current.files = dataTransfer.files;
  }

  function setImagePreview(file: File) {
    if (!file.type.startsWith("image/")) {
      setImageState({
        text: "画像ファイルを選択してください。",
        tone: "error",
      });
      return;
    }

    if (file.size > MAX_CLIP_IMAGE_SIZE) {
      setImageState({
        text: "画像は5MB以下にしてください。",
        tone: "error",
      });
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const nextObjectUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextObjectUrl;
    setImagePreviewUrl(nextObjectUrl);
    setImageLabel(file.name || "貼り付け画像");
    setImageState({
      text: "画像を選択しました。保存時にアップロードされます。",
      tone: "success",
    });
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImagePreview(file);
  }

  function handleImagePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));

    if (!imageItem) {
      return;
    }

    const file = imageItem.getAsFile();

    if (!file) {
      return;
    }

    event.preventDefault();
    syncInputFile(file);
    setImagePreview(file);
  }

  async function handleFetchTitle() {
    if (!url.trim()) {
      setFetchState({
        text: "タイトルを取得する前にURLを入力してください。",
        tone: "error",
      });
      return;
    }

    const requestUrl = url.trim();
    const requestId = titleFetchIdRef.current + 1;
    titleFetchIdRef.current = requestId;
    setIsFetchingTitle(true);
    setFetchState(null);

    try {
      const response = await fetch(`/api/fetch-title?url=${encodeURIComponent(requestUrl)}`, {
        method: "GET",
      });
      const payload = (await response.json()) as { error?: string; title?: string };

      if (isStaleFetch(requestUrl, requestId, titleFetchIdRef.current)) {
        return;
      }

      if (!response.ok || !payload.title) {
        setFetchState({
          text: payload.error ?? "ページタイトルの取得に失敗しました。",
          tone: "error",
        });
        return;
      }

      const replaced = applyFetchedTitle(payload.title);
      setFetchState({
        text: replaced ? "タイトルを取得しました。" : "タイトルを取得しました。既存のタイトルは保持しました。",
        tone: "success",
      });
    } catch {
      if (isStaleFetch(requestUrl, requestId, titleFetchIdRef.current)) {
        return;
      }

      setFetchState({
        text: "ページタイトルの取得に失敗しました。",
        tone: "error",
      });
    } finally {
      if (requestId === titleFetchIdRef.current) {
        setIsFetchingTitle(false);
      }
    }
  }

  async function handleFetchContent() {
    if (!url.trim()) {
      setFetchState({
        text: "本文を取得する前にURLを入力してください。",
        tone: "error",
      });
      return;
    }

    const requestUrl = url.trim();
    const requestId = contentFetchIdRef.current + 1;
    contentFetchIdRef.current = requestId;
    setIsFetchingContent(true);
    setFetchState(null);

    try {
      const response = await fetch(`/api/fetch-content?url=${encodeURIComponent(requestUrl)}`, {
        method: "GET",
      });
      const payload = (await response.json()) as {
        body?: string;
        error?: string;
        method?: "fallback" | "readability";
        title?: string;
      };

      if (isStaleFetch(requestUrl, requestId, contentFetchIdRef.current)) {
        return;
      }

      if (!response.ok || !payload.body) {
        setFetchState({
          text: getFetchContentErrorMessage(response.status, payload.error),
          tone: "error",
        });
        return;
      }

      const titleApplied = payload.title ? applyFetchedTitle(payload.title) : false;
      const bodyApplied = applyFetchedBody(payload.body);
      const fragments = [];

      if (titleApplied) {
        fragments.push("タイトルを更新");
      }

      if (bodyApplied) {
        fragments.push("本文を更新");
      }

      setFetchState({
        text:
          fragments.length > 0
            ? `本文を取得しました（${payload.method} / ${payload.body.length}文字 / ${fragments.join("、")}）。`
            : `本文を取得しました（${payload.method} / ${payload.body.length}文字）。既存の入力は保持しました。`,
        tone: "success",
      });
    } catch {
      if (isStaleFetch(requestUrl, requestId, contentFetchIdRef.current)) {
        return;
      }

      setFetchState({
        text: "ページ本文の取得に失敗しました。",
        tone: "error",
      });
    } finally {
      if (requestId === contentFetchIdRef.current) {
        setIsFetchingContent(false);
      }
    }
  }

  return (
    <form
      action={formAction}
      className="mx-auto grid w-full max-w-[1120px] gap-0 border-[3px] border-[var(--ui-border)] bg-[var(--panel-bg)] text-[var(--panel-fg)]"
    >
      <div className="flex items-start justify-between gap-4 border-b-[3px] border-[var(--ui-border)] bg-[var(--ui-fg)] px-5 py-5 text-[var(--ui-bg)] md:px-8 md:py-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em]">[記事入力]</p>
          <h1 className="text-4xl font-black uppercase leading-none md:text-[3.75rem]">{heading}</h1>
        </div>
        <Link className={buttonStyles({ size: "small", variant: "secondary" })} href={cancelHref}>
          閉じる
        </Link>
      </div>

      <div className="grid gap-8 p-5 md:grid-cols-[1.6fr_0.92fr] md:px-8 md:py-9">
        <div className="grid gap-7">
          <div className="grid gap-3">
            <p className="max-w-[56ch] text-sm leading-7 text-[var(--ui-muted)]">{description}</p>
            {state.message ? (
              <FormMessage tone={state.status === "error" ? "error" : "success"}>{state.message}</FormMessage>
            ) : null}
          </div>

          <Field error={state.fieldErrors?.title?.[0]} label="タイトル">
            <Input
              name="title"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="記事タイトル"
              required
              value={title}
            />
          </Field>

          <Field description="任意の参照元URLです。" error={state.fieldErrors?.url?.[0]} label="URL">
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <Input
                  name="url"
                  onChange={handleUrlChange}
                  placeholder="https://example.com/article"
                  type="url"
                  value={url}
                />
                <button
                  className={buttonStyles({ variant: "secondary" })}
                  disabled={isFetchingTitle || isFetchingContent}
                  onClick={handleFetchTitle}
                  type="button"
                >
                  {isFetchingTitle ? "取得中..." : "タイトル取得"}
                </button>
                <button
                  className={buttonStyles({ variant: "secondary" })}
                  disabled={isFetchingTitle || isFetchingContent}
                  onClick={handleFetchContent}
                  type="button"
                >
                  {isFetchingContent ? "取得中..." : "本文取得"}
                </button>
              </div>
              <p className="text-xs leading-6 text-[var(--ui-muted)]">
                記事ページのURLに向いています。トップページ、商品ページ、ログインが必要なページ、JavaScript依存のページは取得できない場合があります。
              </p>
              {fetchState ? <FormMessage tone={fetchState.tone}>{fetchState.text}</FormMessage> : null}
            </div>
          </Field>

          <Field description="保存する本文です。" error={state.fieldErrors?.body?.[0]} label="本文">
            <Textarea
              className="min-h-72"
              name="body"
              onChange={(event) => setBody(event.target.value)}
              placeholder="記事本文を貼り付けるか入力してください。"
              value={body}
            />
          </Field>

          <Field description="あとで読み返すための個人メモです。" error={state.fieldErrors?.memo?.[0]} label="メモ">
            <Textarea
              className="min-h-52"
              defaultValue={values.memo}
              name="memo"
              placeholder="メモ、感想、リマインダーを入力してください。"
            />
          </Field>
        </div>

        <aside className="grid gap-6">
          <Field
            description="画像を1枚アップロード、またはプレビュー枠へ貼り付けできます。"
            error={state.fieldErrors?.image?.[0]}
            label="画像"
          >
            <div className="grid gap-4 border-[3px] border-[var(--ui-border)] p-5">
              <div
                aria-label="画像の貼り付け領域"
                className="grid gap-3"
                onPaste={handleImagePaste}
                role="group"
                tabIndex={0}
              >
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--panel-fg)]">プレビュー</p>
                  <p className="text-2xl font-black uppercase text-[var(--panel-fg)]">画像</p>
                </div>

                <div className="relative flex min-h-48 items-center justify-center overflow-hidden border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)]">
                  {imagePreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="選択した画像のプレビュー" className="h-full min-h-48 w-full object-cover" src={imagePreviewUrl} />
                  ) : (
                    <div className="grid gap-2 px-5 py-8 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ui-muted)]">画像なし</p>
                      <p className="text-sm leading-7 text-[var(--ui-muted)]">
                        画像をアップロードするか、ここにクリップボードから貼り付けてください。
                      </p>
                    </div>
                  )}
                </div>

                <input
                  accept="image/*"
                  className="hidden"
                  name="image"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  type="file"
                />

                <div className="flex flex-wrap gap-3">
                  <button className={buttonStyles({ variant: "secondary" })} onClick={() => fileInputRef.current?.click()} type="button">
                    画像を選択
                  </button>
                  <span className="text-xs leading-6 text-[var(--ui-muted)]">
                    この枠にフォーカスした状態で画像を貼り付けできます。
                  </span>
                </div>

                {imageLabel ? <p className="text-xs leading-6 text-[var(--ui-muted)]">選択中: {imageLabel}</p> : null}
                {imageState ? <FormMessage tone={imageState.tone}>{imageState.text}</FormMessage> : null}
              </div>
            </div>
          </Field>

          <div className="grid gap-4 border-[3px] border-[var(--ui-border)] p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--panel-fg)]">タグ</p>
              <p className="text-sm leading-7 text-[var(--ui-muted)]">
                この記事に付けるタグを選択してください。
              </p>
            </div>

            {tagOptions.length === 0 ? (
              <div className="grid gap-3">
                <p className="text-sm leading-7 text-[var(--ui-muted)]">まだタグがありません。</p>
                {allowInlineTagCreate ? null : (
                  <Link className={buttonStyles({ className: "w-full", variant: "secondary" })} href="/tags">
                    タグ管理を開く
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => {
                  const isChecked = selectedTagIds.includes(tag.id);
                  const backgroundColor = isChecked ? tag.color ?? "var(--tag-neutral-bg)" : "var(--panel-bg)";
                  const textColor = isChecked ? getTagTextColor(tag.color) : "var(--panel-fg)";

                  return (
                    <label
                      className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border-2 border-[var(--ui-border)] px-3 text-xs font-semibold tracking-[0.12em]"
                      key={tag.id}
                      style={{ backgroundColor, color: textColor }}
                    >
                      <input
                        className="h-4 w-4 accent-[var(--ui-fg)]"
                        checked={isChecked}
                        name="tagIds"
                        onChange={() => toggleTagSelection(tag.id)}
                        type="checkbox"
                        value={tag.id}
                      />
                      <span>{tag.name}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {allowInlineTagCreate ? (
              <div className="grid gap-3 border-t-2 border-[var(--ui-border-soft)] pt-4">
                {isTagCreateOpen ? (
                  <div className="grid gap-3 border-2 border-[var(--ui-border-soft)] p-4">
                    <Input
                      aria-label="新しいタグ名"
                      onChange={(event) => setNewTagName(event.target.value)}
                      placeholder="新しいタグ名"
                      value={newTagName}
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        className={buttonStyles({ size: "small", variant: "secondary" })}
                        disabled={isCreatingTag}
                        onClick={handleCreateTag}
                        type="button"
                      >
                        {isCreatingTag ? "作成中..." : "タグを作成"}
                      </button>
                      <button
                        className={buttonStyles({ size: "small", variant: "outline" })}
                        disabled={isCreatingTag}
                        onClick={() => {
                          setIsTagCreateOpen(false);
                          setNewTagName("");
                          setTagCreateMessage(null);
                        }}
                        type="button"
                      >
                        キャンセル
                      </button>
                    </div>
                    {tagCreateMessage ? <FormMessage tone={tagCreateMessage.tone}>{tagCreateMessage.text}</FormMessage> : null}
                  </div>
                ) : (
                  <button
                    className="w-fit text-sm font-semibold tracking-[0.08em] text-[var(--panel-fg)] underline underline-offset-4"
                    onClick={() => {
                      setIsTagCreateOpen(true);
                      setTagCreateMessage(null);
                    }}
                    type="button"
                  >
                    + 新しいタグを作成
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t-[3px] border-[var(--ui-border)] px-5 py-5 md:flex-row md:justify-end md:px-8">
        <Link className={buttonStyles({ variant: "secondary" })} href={cancelHref}>
          キャンセル
        </Link>
        <SubmitButton idleLabel={submitLabel} pendingLabel="保存中..." />
      </div>
    </form>
  );
}
