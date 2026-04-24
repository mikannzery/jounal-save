# CLIP MEMO Spec

## Overview

CLIP MEMO is a private article archive for one user.
It is not a bookmark list. The goal is to save, sort, revisit, and manage reading material.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Database
- Supabase Storage

## Access Control

- Only authenticated users can access app pages.
- Unauthenticated users are redirected to `/login`.
- When Supabase environment variables are missing, the app redirects to `/setup`.

## Design Direction

- Black and white base
- Thick borders
- Large typography
- Wide spacing
- Editorial / archive / zine feeling
- Black strip header with compact horizontal navigation
- List pages use a small section label, one large heading, top-right controls, and a separate sort row
- New clip form is presented as a modal-like sheet with a dark top bar
- List-page controls use monochrome buttons: white background, black text, and light-gray hover
- Shared button styling is split into `outline` and `filled`, with `inverse` reserved for controls placed on the black header
- Tag chips use outline styling plus a framed color swatch instead of filling the full chip with the tag color
- Main navigation, list headings, sort labels, and card actions are presented in Japanese-first UI copy
- List page controls keep `favorite`, `archive`, `select`, `view`, `edit`, and `export`, but the labels are arranged for faster scanning
- Dark mode uses direct black/white theme overrides instead of a full-page invert filter so text, borders, and active controls stay readable
- List pages use the same structure in light and dark mode, with only the color system switching between black-on-white and white-on-black
- The main list heading is intentionally oversized but kept below poster scale so it does not dominate the full viewport on desktop
- Header controls use an icon-driven layout with `+ 新規`, a moon/sun theme toggle, and compact utility actions
- The theme toggle uses monochrome SVG line icons instead of emoji so the header stays visually consistent
- The main clip cards use icon-only top-right actions for edit, source link, and favorite state
- Export is opened from one button and then split into JSON / CSV choices inside a popover menu
- Tag chips use filled, readable backgrounds so they remain legible in both themes
- Active sort, view, tag, and selection buttons use a readable muted fill instead of a pure black fill, then invert only on hover
- Active sort, view, tag, and selection buttons share a single `.active-control` rule so selected labels and icons remain visible in both light and dark modes
- Grid list pages prioritize scanability over reading depth: cards are compact, image-free, and arranged in 3 columns on desktop, 2 on tablet, and 1 on mobile
- List cards clamp titles and excerpts so one screen can show more clips at once without excessive vertical growth
- Main list pages follow the reference layout more strictly: black strip header, large `ALL CLIPS` section heading on `/clips`, right-aligned view/export/select/count controls, and a separate sort row
- Main list page headings keep the editorial hierarchy but are capped below oversized poster scale for readability
- Main list page headings are treated as supporting labels rather than hero typography, using roughly 36px and `font-weight: 700`
- `/clips` uses a reference-oriented paper layout with a flush black header, horizontal section dividers, a light gray page background around white panels, compact sort chips, and title-first cards
- `/clips` toolbar controls align around a shared 48px height, sort and tag controls use smaller fixed-height chips, and grid cards fill their three-column tracks to match the reference density
- The `/clips` count display is intentionally subdued, and the card action set is `edit / export / favorite` while the original source URL remains available in the card metadata row
- Header utilities, toolbar toggles, and clip-card actions share one monochrome SVG icon set, and user-facing archive wording uses `アーカイブ`
- The header `新規` button uses a dedicated override class so its text and SVG stay black and visible inside the white button on the black header
- The clip detail page uses theme variables for title, body, metadata, URL, labels, borders, and placeholder states so dark mode keeps readable contrast
- List cards use `2px` borders, `24px` padding, `360px` max width in grid mode, `32px` grid gaps, no shadow, and icon-only actions sized around `18px`
- The app font stack prioritizes `Noto Sans JP` for Japanese-first editorial UI

## Data Model

### clips

- `id`
- `user_id`
- `title`
- `body`
- `url`
- `memo`
- `ai_summary`
- `ai_summary_updated_at`
- `image_path`
- `is_favorite`
- `is_archived`
- `created_at`
- `updated_at`

### tags

- `id`
- `user_id`
- `name`
- `color`
- `created_at`

### clip_tags

- `id`
- `clip_id`
- `tag_id`

## Implemented Scope

### STEP1

- Authentication
- Protected routes
- Clip create
- Clip list
- Clip detail
- Clip edit
- Archive from detail
- Archive list
- Restore from archive
- Permanent delete from archive
- Validation with Zod
- Loading / error / empty states

### STEP2

- Favorite toggle on clip cards
- Favorite toggle on clip detail page
- `/favorites` page
- Sort by URL query on `/clips`, `/favorites`, `/archive`
- View switch by URL query on `/clips`, `/favorites`, `/archive`
- Archive page UI aligned with the main list UI

### STEP3

- Tag CRUD page on `/tags`
- Tag assignment on clip create and edit
- Tag filter by URL query on `/clips`, `/favorites`, `/archive`
- Selection mode on `/clips` and `/favorites`
- Bulk archive from list pages

### STEP4

- Export as JSON and CSV from `/clips`, `/favorites`, and `/archive`
- Export reflects current page scope, sort, and tag filter
- Export is opened from a single toolbar button, then the user chooses `JSON` or `CSV`
- URL title fetch on new and edit clip forms
- URL content fetch on new and edit clip forms
- Final pass on toolbar states and button readability

## Sort Options

- `created_desc`
- `created_asc`
- `updated_desc`
- `updated_asc`
- `title_asc`
- `title_desc`

## View Options

- `view=grid`
- `view=list`

## Current Pages

### `/login`

- Sign in / sign up screen
- Redirects to `/clips` after login

### `/setup`

- Shows setup instructions when Supabase env vars are missing
- Explains `.env.local` and `supabase/schema.sql`

### `/clips`

- Main clip list
- Sort and view query UI
- Favorite toggle on cards
- Empty state with create CTA
- Header area includes view toggle, export controls, selection mode, and item count
- Supports `tag=` filtering
- Supports `year=` and `month=` filtering for calendar-driven monthly views
- Shows the active month filter in the content area and includes a clear action that preserves `sort`, `tag`, `view`, and `select` query state
- `要約を見る` on list cards opens the clip detail page at the AI summary section anchor
- Supports `select=on` for bulk archive mode

### `/clips/new`

- New clip form
- Fields: `title`, `image`, `body`, `url`, `memo`
- Uses a modal-style centered layout with a close action
- Allows assigning existing tags
- Includes a `Fetch Title` button for URL-based title lookup
- Includes a `Fetch Content` button for URL-based body extraction
- Fetch controls show article-oriented guidance, clearer error states, and a short success summary
- Accepts one image by file upload or clipboard paste
- Shows the selected image preview before saving

### `/clips/[id]`

- Clip detail
- Favorite toggle
- Archive action
- Reading-first layout with a slightly reduced title scale
- Content order is `Source URL` -> `Body` -> `Memo`
- Memo is shown below the body and falls back to a subdued empty state when missing
- AI summary is shown in a separate section below the memo
- AI summary can be generated and regenerated from the detail page
- Generated summaries are saved to the clip record and show the latest update date
- The AI summary section exposes the `#ai-summary` anchor and scroll margin for direct hash navigation
- The body area uses a wider reading column than the memo area
- An `Edit` button is shown near the title for direct navigation to `/clips/[id]/edit`
- Displays the saved thumbnail when `image_path` exists

### `/clips/[id]/edit`

- Edit form with existing values
- Allows updating assigned tags
- Includes a `Fetch Title` button for URL-based title lookup
- Includes a `Fetch Content` button for URL-based body extraction
- Fetch controls show article-oriented guidance, clearer error states, and a short success summary
- Supports replacing the clip image by upload or clipboard paste
- Uses shared theme variables for labels, helper text, placeholders, preview text, tag chips, and action text so dark mode remains readable throughout the form

### `/favorites`

- Shows non-archived clips where `is_favorite = true`
- Supports sort and view query UI
- Supports `tag=` filtering
- Supports selection mode and bulk archive
- Supports JSON / CSV export with current filters applied

### `/archive`

- Shows archived clips
- Supports sort and view query UI
- Restore and permanent delete actions
- Supports `tag=` filtering
- Supports JSON / CSV export with current filters applied

### `/calendar`

- Year view with monthly counts
- Each month card links to `/clips` with `year` and `month` query filters
- Uses shared theme variables for year heading, helper label, month names, and count labels so dark mode remains readable
- Uses a slightly reduced heading scale and tighter hero spacing than the main clip index

### `/tags`

- Tag list with usage counts
- Tag create, edit, and delete
- Tag color display and editing
- Uses shared theme variables for headings, helper labels, form inputs, placeholders, and tag metadata so dark mode remains readable
- Uses a slightly reduced heading scale and tighter hero spacing than the main clip index

## Rules

- All clip reads and writes must be scoped by `user_id`.
- Items are not hard-deleted from the main list.
- Permanent delete is only available from `/archive`.
- Favorite state uses `clips.is_favorite`.
- Deleting a tag removes tag links but does not delete clips.
- Clip images are stored in the `clip-images` Supabase Storage bucket.
- The `clip-images` bucket can remain private; image rendering uses signed URLs generated at view time while `image_path` stays in the database
- Image input accepts one image file and clipboard paste, up to 5MB.
- Clip save actions now distinguish image upload failures from clip database save failures, and server logs include storage bucket, file metadata, and Supabase error messages for debugging
- Export reflects the active page scope plus `sort`, `tag`, and optional `year` / `month` query state.
- The list export control opens a menu so the user can explicitly choose JSON or CSV before downloading.
- The clip-card export icon also opens a JSON / CSV choice menu; single-clip CSV uses the same column set as list CSV.
- List export and single-clip export share the same CSV column mapping and JSON payload shape through a common export helper.
- CSV export contains main text fields and joined tag names.
- CSV export is emitted as UTF-8 with BOM for safer Japanese handling in spreadsheet apps.
- JSON export includes tag objects and clip metadata.
- URL title fetch only applies when the user clicks the button.
- If a title already exists, fetched titles are not applied silently.
- URL content fetch tries `Readability` first, then `article`, `main`, meta description, and joined paragraphs.
- Boilerplate elements such as `footer`, `nav`, `aside`, and form-like blocks are stripped before extraction.
- Extracted content is normalized, trimmed, and capped at 18000 characters.
- Content fetch succeeds only when at least 200 characters of body text are extracted.
- The form UI distinguishes invalid URL, non-article pages, and blocked fetch failures with separate messages.
- AI summary generation uses Gemini on the server side and stores the result in `clips.ai_summary`.
- If `GEMINI_API_KEY` is missing, detail-page AI summary UI remains visible and shows a clear error message.
- Gemini model selection is controlled by `GEMINI_MODEL` on the server; default is `gemini-1.5-flash` when unset.
- AI summary generation is rejected when the clip body is empty or shorter than 200 characters.
- `"use server"` modules export async server actions only; shared constants/types stay non-exported or live in regular modules.
- TypeScript typecheck includes stable `.next/types/**/*.ts` only; dev-only route type artifacts under `.next/dev/types` are excluded from `tsc` because they can become malformed independently of app source changes.
- The clip detail signed-image view and edit-form blob preview intentionally use native `<img>` rendering instead of `next/image`; lint suppression is local and documented because those URLs are runtime-signed or browser-generated.

## Not Yet Implemented

- Markdown editing
- Inline calendar drilldown view
