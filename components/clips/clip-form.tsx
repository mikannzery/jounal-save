"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/types/clip";
import type { ActionState, ClipFormValues, TagRow } from "@/types/clip";

interface ClipFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  availableTags: TagRow[];
  cancelHref: string;
  description: string;
  heading: string;
  initialImagePreviewUrl?: string | null;
  submitLabel: string;
  values: ClipFormValues;
}

const maxImageSize = 5 * 1024 * 1024;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

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

    const shouldReplace = window.confirm("A title is already filled in. Replace it with the fetched title?");

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

    const shouldReplace = window.confirm("Body text is already filled in. Replace it with the fetched content?");

    if (shouldReplace) {
      setBody(nextBody);
      return true;
    }

    return false;
  }

  function getFetchContentErrorMessage(status: number, fallbackMessage?: string) {
    if (status === 400) {
      return fallbackMessage ?? "Enter a valid URL before fetching content.";
    }

    if (status === 422) {
      return "This page does not look like a readable article. Try a direct article URL instead of a homepage or product page.";
    }

    if (status === 502) {
      return "The page could not be fetched. The site may block automated access or require JavaScript.";
    }

    return fallbackMessage ?? "Failed to fetch the page content.";
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
        text: "Select an image file only.",
        tone: "error",
      });
      return;
    }

    if (file.size > maxImageSize) {
      setImageState({
        text: "Image must be 5MB or smaller.",
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
    setImageLabel(file.name || "pasted-image");
    setImageState({
      text: "Image ready. It will be uploaded when you save.",
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
        text: "Enter a URL before fetching the title.",
        tone: "error",
      });
      return;
    }

    setIsFetchingTitle(true);
    setFetchState(null);

    try {
      const response = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`, {
        method: "GET",
      });
      const payload = (await response.json()) as { error?: string; title?: string };

      if (!response.ok || !payload.title) {
        setFetchState({
          text: payload.error ?? "Failed to fetch the page title.",
          tone: "error",
        });
        return;
      }

      const replaced = applyFetchedTitle(payload.title);
      setFetchState({
        text: replaced ? "Title fetched successfully." : "Title fetched. Existing title was kept.",
        tone: "success",
      });
    } catch {
      setFetchState({
        text: "Failed to fetch the page title.",
        tone: "error",
      });
    } finally {
      setIsFetchingTitle(false);
    }
  }

  async function handleFetchContent() {
    if (!url.trim()) {
      setFetchState({
        text: "Enter a URL before fetching the content.",
        tone: "error",
      });
      return;
    }

    setIsFetchingContent(true);
    setFetchState(null);

    try {
      const response = await fetch(`/api/fetch-content?url=${encodeURIComponent(url)}`, {
        method: "GET",
      });
      const payload = (await response.json()) as {
        body?: string;
        error?: string;
        method?: "fallback" | "readability";
        title?: string;
      };

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
        fragments.push("title updated");
      }

      if (bodyApplied) {
        fragments.push("body updated");
      }

      setFetchState({
        text:
          fragments.length > 0
            ? `Content fetched via ${payload.method}. ${payload.body.length} chars, ${fragments.join(", ")}.`
            : `Content fetched via ${payload.method}. ${payload.body.length} chars. Existing fields were kept.`,
        tone: "success",
      });
    } catch {
      setFetchState({
        text: "Failed to fetch the page content.",
        tone: "error",
      });
    } finally {
      setIsFetchingContent(false);
    }
  }

  return (
    <form
      action={formAction}
      className="mx-auto grid w-full max-w-[1120px] gap-0 border-[3px] border-[var(--ui-border)] bg-[var(--panel-bg)] text-[var(--panel-fg)]"
    >
      <div className="flex items-start justify-between gap-4 border-b-[3px] border-[var(--ui-border)] bg-[var(--ui-fg)] px-5 py-5 text-[var(--ui-bg)] md:px-8 md:py-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em]">[Create Entry]</p>
          <h1 className="text-4xl font-black uppercase leading-none md:text-[3.75rem]">{heading}</h1>
        </div>
        <Link className={buttonStyles({ size: "small", variant: "secondary" })} href={cancelHref}>
          Close
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

          <Field error={state.fieldErrors?.title?.[0]} label="Title">
            <Input
              name="title"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Article title"
              required
              value={title}
            />
          </Field>

          <Field description="Optional source URL." error={state.fieldErrors?.url?.[0]} label="URL">
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <Input
                  name="url"
                  onChange={(event) => setUrl(event.target.value)}
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
                  {isFetchingTitle ? "Fetching..." : "Fetch Title"}
                </button>
                <button
                  className={buttonStyles({ variant: "secondary" })}
                  disabled={isFetchingTitle || isFetchingContent}
                  onClick={handleFetchContent}
                  type="button"
                >
                  {isFetchingContent ? "Fetching..." : "Fetch Content"}
                </button>
              </div>
              <p className="text-xs leading-6 text-[var(--ui-muted)]">
                Best for direct article pages. Home, product, login, or JavaScript-heavy pages may fail.
              </p>
              {fetchState ? <FormMessage tone={fetchState.tone}>{fetchState.text}</FormMessage> : null}
            </div>
          </Field>

          <Field description="Plain text for the first version." error={state.fieldErrors?.body?.[0]} label="Body">
            <Textarea
              className="min-h-72"
              name="body"
              onChange={(event) => setBody(event.target.value)}
              placeholder="Paste or type the article text here."
              value={body}
            />
          </Field>

          <Field description="Private notes for later review." error={state.fieldErrors?.memo?.[0]} label="Memo">
            <Textarea
              className="min-h-52"
              defaultValue={values.memo}
              name="memo"
              placeholder="Add your own notes, impressions, or reminders."
            />
          </Field>
        </div>

        <aside className="grid gap-6">
          <Field
            description="Upload one image or paste a copied image into the preview box."
            error={state.fieldErrors?.image?.[0]}
            label="Image"
          >
            <div className="grid gap-4 border-[3px] border-[var(--ui-border)] p-5">
              <div className="grid gap-3" onPaste={handleImagePaste} tabIndex={0}>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--panel-fg)]">Preview</p>
                  <p className="text-2xl font-black uppercase text-[var(--panel-fg)]">Clip Sheet</p>
                </div>

                <div className="relative flex min-h-48 items-center justify-center overflow-hidden border-2 border-[var(--ui-border)] bg-[var(--tag-neutral-bg)]">
                  {imagePreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Selected clip thumbnail preview" className="h-full min-h-48 w-full object-cover" src={imagePreviewUrl} />
                  ) : (
                    <div className="grid gap-2 px-5 py-8 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ui-muted)]">No Image</p>
                      <p className="text-sm leading-7 text-[var(--ui-muted)]">
                        Upload an image or paste from the clipboard here.
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
                    Upload Image
                  </button>
                  <span className="text-xs leading-6 text-[var(--ui-muted)]">
                    Copy an image and paste it while this box is focused.
                  </span>
                </div>

                {imageLabel ? <p className="text-xs leading-6 text-[var(--ui-muted)]">Selected: {imageLabel}</p> : null}
                {imageState ? <FormMessage tone={imageState.tone}>{imageState.text}</FormMessage> : null}
              </div>
            </div>
          </Field>

          <div className="grid gap-4 border-[3px] border-[var(--ui-border)] p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--panel-fg)]">Tags</p>
              <p className="text-sm leading-7 text-[var(--ui-muted)]">
                Pick the tags that should travel with this clip.
              </p>
            </div>

            {availableTags.length === 0 ? (
              <div className="grid gap-3">
                <p className="text-sm leading-7 text-[var(--ui-muted)]">No tags available yet.</p>
                <Link className={buttonStyles({ className: "w-full", variant: "secondary" })} href="/tags">
                  Open Tags
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isChecked = values.tagIds.includes(tag.id);
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
                        defaultChecked={isChecked}
                        name="tagIds"
                        type="checkbox"
                        value={tag.id}
                      />
                      <span>{tag.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t-[3px] border-[var(--ui-border)] px-5 py-5 md:flex-row md:justify-end md:px-8">
        <Link className={buttonStyles({ variant: "secondary" })} href={cancelHref}>
          Cancel
        </Link>
        <SubmitButton idleLabel={submitLabel} pendingLabel="Saving..." />
      </div>
    </form>
  );
}
