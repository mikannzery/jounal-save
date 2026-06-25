# CLIP MEMO History

## 2026-04-18

- Created the project spec and work history files.
- Built the initial Next.js App Router app with TypeScript, Tailwind CSS, and Supabase wiring.
- Implemented STEP1 authentication and protected routing.
- Implemented clip create, list, detail, edit, archive, restore, and permanent delete.
- Added `/setup` guidance for missing Supabase configuration.
- Added validation, loading states, empty states, and error feedback for STEP1 flows.
- Updated the visual design toward a black-and-white editorial layout.
- Added header navigation and shell routes for calendar, favorites, and tags.

## 2026-04-19

- Completed STEP2 favorite support using `clips.is_favorite`.
- Added favorite toggle on clip cards and on the clip detail page.
- Implemented `/favorites` as a real filtered list page.
- Added sort query support on `/clips`, `/favorites`, and `/archive`.
- Added view query support (`grid` / `list`) on `/clips`, `/favorites`, and `/archive`.
- Refactored the archive page to share the same list-style information architecture as the main clip index.
- Revalidated `/clips`, `/favorites`, `/archive`, and clip detail pages after favorite/archive related server actions.
- Rewrote `spec.md` and `history.md` to remove mojibake and reflect the current product state.
- Reworked the header into a compact black navigation bar with right-side utility actions.
- Adjusted the clip index header to better match the reference layout with a large title block, top-right controls, and a dedicated sort row.
- Refined clip cards for denser editorial spacing in both grid and list modes.
- Strengthened the `NEW CLIP` page as a modal-like sheet without changing the existing form actions.
- Implemented STEP3 tag CRUD on `/tags` with usage counts and color editing.
- Added tag assignment to clip create and edit forms.
- Added tag filtering by query string to `/clips`, `/favorites`, and `/archive`.
- Implemented selection mode and bulk archive on `/clips` and `/favorites` while keeping favorite/archive actions intact.
- Implemented STEP4 export routes for JSON and CSV, using the active page scope plus current sort and tag filters.
- Added URL title fetching on clip create and edit forms with success/error feedback and overwrite confirmation.
- Replaced placeholder export controls in list headers with live JSON/CSV actions across `/clips`, `/favorites`, and `/archive`.
- Updated `spec.md` to reflect STEP4 behavior and the remaining unfinished scope.
- Ran STEP4 quality checks against live responses, including export filters, Japanese content handling, and fetch-title error patterns.
- Added UTF-8 BOM to CSV export to reduce Japanese mojibake risk in spreadsheet apps.
- Added `Readability`-based content extraction with fallback strategies in `/api/fetch-content`.
- Extended clip create/edit forms with `Fetch Content`, including confirm-based overwrite behavior for existing title/body values.
- Ran fetch-content quality checks across article, Japanese news, homepage, product, JavaScript-heavy, and bot-restricted URLs.
- Added a lightweight boilerplate strip so product pages fall back to a clean extraction failure instead of returning footer-heavy noise.
- Polished the fetch UX by separating 422 vs 502 messages, adding an article-page note, and showing method/character count on successful content fetches.
- Unified list-page controls around a monochrome button style so toolbar, sort, filter, selection, and empty-state buttons no longer flip to black backgrounds.
- Adjusted the clip detail page for reading comfort by reducing the title scale and stacking source URL, body, and memo vertically.
- Expanded the clip detail body column and added a direct `Edit` button near the title while keeping favorite and archive actions intact.
- Unified button styling around outline and filled rules, moved dark-header utilities to an inverse style, and converted tag chips to outline pills with framed color swatches.
- Reworked list pages toward a Japanese-first UI by translating headings, sort labels, counters, toolbar copy, archive/favorite feedback, and card actions while preserving favorite, archive, select, view switching, edit, and export.
- Added clip image support with file upload and clipboard paste in create/edit forms, persisted image paths to Supabase Storage, and rendered saved thumbnails on list cards and the detail page.
- Replaced the old dark-mode invert approach with direct dark theme overrides so list text, borders, and control labels remain readable without breaking the monochrome design.
- Fixed the theme toggle hydration mismatch by making the client theme state subscribe to localStorage safely after SSR.
- Changed list-page export controls from always-visible `JSON / CSV` buttons to a single export menu that opens and lets the user choose the format.

## 2026-04-20

- Rebuilt the list-page visual system around explicit light/dark CSS variables instead of patchwork per-component overrides.
- Redesigned the main clip index, favorites, and archive headers so they share the same layout and switch only colors across themes.
- Reworked the header utilities into an icon-driven pattern with `+ 新規`, a moon/sun theme toggle, and a compact logout control.
- Replaced clip-card text actions with icon-only edit, source-link, and favorite controls while keeping the underlying behavior intact.
- Updated tag chips and tag filters so they stay readable against both white and black page surfaces.
- Rewrote several mojibake-affected UI strings on list pages, sort labels, and archive/favorite surfaces back into clear Japanese copy.
- Reduced the main list heading scale slightly to lower visual pressure while keeping the editorial hierarchy.
- Changed active toolbar and filter states from solid black fills to readable muted fills so text and icons remain visible before hover.
- Removed the explicit `encType` from the server-action clip form to eliminate the React form warning without changing upload behavior.
- Reworked list cards into a denser overview layout: removed thumbnails from `/clips`, `/favorites`, and `/archive`, reduced title scale, shortened excerpts, and switched the grid to 3 columns on desktop.
- Split clip image upload failures from clip DB save failures and added explicit server-side diagnostics for bucket name, file metadata, storage errors, and insert/update errors.
- Switched image rendering for private Storage usage to signed URLs on the clip detail page and edit-form preview, while keeping `image_path` storage unchanged.

## 2026-04-23

- Added `ai_summary` and `ai_summary_updated_at` to the `clips` schema and TypeScript database types.
- Implemented Gemini-based AI summary generation on the server via a new clip action that stores results in the database.
- Added body-length guardrails (minimum 200 characters) and clear user-facing errors for invalid generation conditions.
- Added `AI要約` section to the clip detail page with generate/regenerate buttons, loading labels, saved summary display, and update date.
- Added explicit fallback behavior when `GEMINI_API_KEY` is not configured so the UI remains stable and explanatory.
- Fixed a Next.js server actions export error by removing non-async exports from `lib/actions/clips.ts`.
- Kept AI summary action behavior unchanged while converting the action state type to an internal type in the `"use server"` module.
- Switched Gemini model selection from a fixed string to `GEMINI_MODEL` with `gemini-1.5-flash` default fallback.
- Added `GEMINI_API_KEY` and `GEMINI_MODEL` examples to `.env.example` for environment-based model switching.
- Reworked the main list UI toward the provided reference: black header alignment, `ALL CLIPS` section heading, right-side controls, a separate sort row, `2px` borders, `32px` list gaps, and compact max-360px cards with 24px padding.
- Standardized list card actions to small icon-only controls and adjusted active button states to keep black/white contrast readable in both themes.
- Updated the global font stack to prefer `Noto Sans JP` for the Japanese editorial interface.
- Replaced the emoji-based theme toggle with monochrome SVG moon/sun line icons and adjusted the header button hover state to match the reference-style black-and-white controls.
- Fixed invisible selected controls by replacing repeated active Tailwind overrides with a shared `.active-control` CSS rule for sort, view, tag filter, and selection mode buttons.
- Reduced the shared list-page heading scale so `ALL CLIPS` and related section titles match the reference size more closely and feel less visually heavy.
- Refined the `/clips` reference-style UI by flattening the list surface against the header, using a light gray page background, tightening the header height, clarifying the `+ 新規` button, resizing sort controls, and reordering clip cards so the title and action icons sit at the top.
- Reduced the shared list heading visual weight to about 36px with bold weight and tighter label spacing so `ALL CLIPS` reads as a supporting section title instead of a hero headline.
- Fine-tuned the `/clips` reference match by standardizing header utility spacing, making the new-clip button larger, aligning toolbar controls to 48px, tightening sort and tag chip sizes, letting cards fill the three-column grid, and softening card icon emphasis.
- Further refined `/clips` by shrinking the count display emphasis, compressing the top hero section vertically, and replacing the card's source-link action icon with a direct per-clip JSON export button while keeping the source URL link in the card metadata.
- Unified the UI iconography around one shared SVG set for header controls, list toolbar icons, clip-card actions, theme toggle, and favorite state, strengthened the header `新規` button text contrast, and replaced remaining user-facing `保管` copy with `アーカイブ`.
- Fixed the header `新規` button visibility bug by adding a dedicated class that force-applies black text and black SVG strokes inside the white button, and slightly softened non-active sort/tag/card borders plus the clip count emphasis.
- Fixed dark-mode readability on the clip detail page by replacing hard-coded light-theme blacks/whites with shared theme variables for headings, body text, metadata, source URL, borders, and empty states.
- Fixed dark-mode readability on `/calendar` and `/tags` by replacing remaining light-theme-only text, border, surface, input, and helper-label colors with the shared theme variables used elsewhere in the app.
- Reduced the visual pressure on `/calendar` and `/tags` by shrinking the large headings, tightening hero padding, and softening those page borders to the same 2px system used elsewhere.
- Made each `/calendar` month card link into `/clips?year=YYYY&month=M`, preserved that filter through sort/view/tag changes on the clip index, and aligned export so JSON/CSV also respect the active month filter.
- Added a visible month-filter status block on `/clips` that shows the active `YYYY年M月` scope, keeps the existing toolbar/query state intact, and provides a dedicated clear button without resetting sort/tag/view/selection mode.
- Restored `npm run typecheck` by removing `.next/dev/types/**/*.ts` from `tsconfig.json` includes after confirming only the dev-generated `routes.d.ts` was malformed while the stable `.next/types/routes.d.ts` was valid.
- Changed the clip-card `要約を見る` action to link directly to the detail page AI summary anchor and added scroll margin on the AI summary section so hash navigation lands below the fixed header.
- Fixed dark-mode readability on `/clips/[id]/edit` by moving shared form labels, helper text, input text, placeholders, preview text, tag selection chips, and success states off hard-coded light-theme colors and onto the theme variables used across the rest of the app.
- Kept the existing export API intact while turning the main list export control into an explicit JSON/CSV dropdown and matching the per-card export icon to the same two-choice export menu, including client-side single-clip CSV download.
- Raised the fetched article body cap from 10000 to 12000 characters in the shared content extractor; save validation remained at 20000 and AI summary keeps using the stored body without a separate 10000-character truncation.
- Raised the fetched article body cap again from 12000 to 18000 characters in the shared content extractor; save validation still remains at 20000 and AI summary still uses the stored body without a separate truncation step.
- Final quality pass: deduplicated export dropdown behavior into one shared component, deduplicated clip JSON/CSV formatting into one shared export helper, aligned `tsconfig.json` with the documented stable `.next/types` policy, and removed the last ESLint image warnings with explicit inline rationale for signed/blob image usage.
- Added inline tag creation to the clip edit form: the editor can create a new tag without leaving the page, duplicate names now reuse the existing owned tag instead of creating another row, and the newly created or reused tag is immediately selected for the pending clip update.
- Enabled the same inline tag creation flow on the new clip form so `/clips/new` can create a tag in place, reuse duplicate names safely, and preselect the created tag before the clip is saved.

## 2026-05-07

- Performed a long-term maintenance hardening pass for CLIP MEMO.
- Repaired mojibake-affected UI copy, sort labels, navigation labels, archive/favorite/tag feedback, card actions, AI summary labels, and Gemini summary prompt text across app source files.
- Added authenticated access checks to `/api/fetch-title` and `/api/fetch-content`.
- Hardened server-side URL fetching with http/https-only validation, DNS resolution, private/loopback/link-local IP blocking, response size limits, content-type checks, and timeout handling.
- Added internal-only redirect normalization for login `next` and bulk archive `returnTo`.
- Expanded middleware protected routes to include `/favorites`, `/tags`, and `/calendar`.
- Shared the clip image size limit between client and server code.
- Reduced repeated auth/client acquisition inside clip image and tag helper functions.
- Gated normal clip-save debug logs behind `CLIP_SAVE_DEBUG=1` while keeping failure diagnostics.
- Updated `supabase/schema.sql` to document `clip-images` as private, add own-image select policy, and add long-term indexes / uniqueness constraints.
- Removed `.next/dev/types/**/*.ts` from `tsconfig.json` includes.
- Added `npm run check:mojibake` for source-level mojibake regression checks.
- Rewrote `spec.md` into a clean current specification for the hardened app.

## 2026-05-20

- Fixed the `/clips/[id]/edit` save-time 500 error caused by `revalidateClipLists()` recursively calling itself until `RangeError: Maximum call stack size exceeded`.
- Changed clip-list revalidation after create/update/archive/restore/delete/favorite actions to explicitly revalidate `/clips`, `/favorites`, and `/archive`.
- Hardened edit save handling so missing clips use `.maybeSingle()` and return form-level errors instead of falling through to an Error Boundary.
- Added structured clip-save diagnostics for Supabase and Storage errors, including `message`, `code`, `details`, and `hint`, while keeping user-facing messages safe.
- Confirmed existing defenses that empty tag arrays skip `clip_tags.insert([])` and null image paths skip Storage deletion / signed URL generation.
- Files changed: `lib/actions/clips.ts`, `spec.md`, `history.md`.
- Verification performed: `npm run lint`, `npm run typecheck -- --incremental false`, `npm run check:mojibake`, and `git diff --check`.
- Hardened URL content fetching so redirects are followed manually and every redirect target is revalidated before fetching.
- Changed clip tag replacement from delete-then-insert to diff-based updates to reduce data-loss risk when tag insertion fails.
- Added cleanup for partially created clips when create-time tag replacement fails, and logged Storage cleanup failures instead of silently ignoring them.
- Removed generated logs, cookies, and TypeScript build info from Git tracking, ignored them going forward, and deleted an accidental pager-help scratch file.
- Improved `/calendar` performance by loading only the selected year's `created_at` values instead of every clip row and every column.
- Added schema indexes for common `updated_at` and title sorts on active/archive clip lists.
- Fixed the route loading state contrast by replacing hard-coded white/black classes with the shared theme panel and text variables.
- Removed the duplicate plus sign from the header `新規` button while keeping the leading plus icon.
- Added a monochrome CLIP MEMO SVG site icon and wired it through Next.js metadata.

## 2026-06-23

- Started staged implementation from the whole-repo improvement plan, prioritizing secret hygiene and high-impact runtime safety.
- Removed `.env.local` from Git tracking without reading or deleting the local file. Follow-up decisions remain for secret rotation and any required Git history scrubbing.
- Added shared safe external URL handling so clip source URLs are saved and rendered only when they use `http` or `https`.
- Updated clip create/update validation to reject unsafe URL schemes such as `javascript:`, `mailto:`, and `ftp:`.
- Hardened clip cards, archived clip cards, and clip detail so existing unsafe URL values are not rendered as clickable external links.
- Changed clip detail loading from `.single()` to `.maybeSingle()`, returning not-found only for 0 rows and throwing on Supabase read errors after structured server logging.
- Added shared calendar year parsing so `/calendar?year=` rejects non-integer or out-of-range values before date range construction and falls back to the current year.
- Hardened archive, bulk archive, restore, delete, and favorite actions so zero affected rows are not reported as successful state changes.
- Changed permanent delete to stop before DB deletion when the archived clip or image path lookup fails.
- Added a shared confirmation submit button and applied it to permanent clip delete and tag delete so destructive actions can be cancelled before Server Actions run.
- Made the shared `danger` button variant visually distinct from normal outline controls.
- Added `focus-visible` rings to shared buttons, inputs, textareas, and header links so keyboard focus is visible on common controls.
- Updated the local Supabase schema so `clip_tags` insert RLS checks both clip ownership and tag ownership.
- Did not apply any remote DB migration; live database policy changes remain an explicit blocked decision.
- Removed internal `image_path` from normal JSON/CSV export output and replaced it with `has_image`.
- Prevented stale URL title/content fetch responses from overwriting the form after the URL changes or a newer fetch starts.
- Made tag creation recover from same-user duplicate creation races by reloading the existing owned tag after a database unique violation.
- Replaced user-facing Supabase auth raw errors with safe generic messages while logging non-secret auth error metadata server-side.
- Preserved the original query string in protected-route login redirects so filtered pages return to the same view after login.
- Adjusted the export dropdown ARIA to match its implemented popover behavior instead of declaring unsupported menu semantics.
- Moved single-clip export behind `/api/export?scope=clip&id=...` so list cards no longer pass full clip export data into the client export button.
- Added defensive wrapping for long detail titles, body text, memo text, tag chips, and tag filter labels to reduce mobile overflow.
- Added live-region roles to shared form messages so async success and error updates are announced by assistive technology.
- Translated primary user-facing copy in auth, setup, error, clip create/edit, URL fetch, image, and tag creation flows into Japanese.
- Connected direct `Field` helper/error text to inputs with `aria-describedby` and `aria-invalid` while leaving wrapper fields for a later focused pass.
- Changed shared `Field` markup so direct controls use `htmlFor` labels and compound fields are no longer wrapped inside a single interactive `<label>`.
- Removed the reintroduced `.next/dev/types/**/*.ts` include from `tsconfig.json` so typecheck depends only on stable Next generated types.
- Removed stale `step4-quality-summary.json` from Git tracking and ignored it as a local verification artifact.
- Expanded `npm run check:mojibake` beyond source files so docs, schema, metadata, and SVG files are included while local generated artifacts remain ignored.
- Hardened export attachment filenames by stripping control characters, limiting clip-title-derived names, and returning UTF-8 filenames through `filename*`.
- Replaced the remaining user-facing English export API error messages with safe Japanese messages.
- Stopped reflecting Gemini raw API error messages to users during AI summary generation and logged minimal server-side failure metadata instead.
- Changed AI summary clip loading from `.single()` to `.maybeSingle()` so missing clips and database errors are handled separately.
- Strengthened uploaded image filename normalization so Storage paths use a bounded, non-empty, ASCII-safe filename suffix.
- Added structured server logs for Supabase failures during clip tag replacement while keeping user-facing save errors generic.
- Added CSV formula-injection protection so exported spreadsheet cells that could be interpreted as formulas are emitted as literal strings.
- Added structured server logs for Supabase failures in tag list, usage, ownership validation, and creation helpers.
- Added structured server logs for Supabase failures in clip list/detail data helpers, including tag resolution and calendar month counts.
- Hardened URL fetching against IPv4-mapped IPv6 private, loopback, and link-local address forms.
- Expanded URL fetching SSRF defenses to reject additional special-purpose IPv4 ranges that are not valid external article targets.
- Added safe failure-code logging for URL title/body fetch operations without logging full requested URLs.
- Validated the signup email redirect origin before passing it to Supabase, falling back to the local origin when the header is not an `http` or `https` origin.
- Made auth callback failures explicit by redirecting missing or failed exchange codes back to login and logging non-secret callback error metadata.
- Translated the remaining English explanatory copy on the login page side panel into Japanese.
- Added explicit `noopener` to external source URL links while preserving the existing safe URL checks and `noreferrer`.
- Translated the empty excerpt fallback text into Japanese.
- Translated the not-found page headings into Japanese.
- Translated the tag creation form labels into Japanese.
- Translated the root metadata description into Japanese.
- Translated export dropdown accessible trigger labels into Japanese while keeping the visible export styling unchanged.
- Added accessible names to tag inline edit inputs with `aria-label` while preserving the compact edit layout.
- Displayed a safe login-page error message when auth callback exchange fails and redirects with `error=callback`.
- Switched tag management create/update/delete feedback to the shared live-region form message component.
- Changed create clip and create tag insert-return reads from `.single()` to `.maybeSingle()` so zero returned rows follow existing safe failure handling.
- Added accessible names to the clip image paste region and inline new-tag input without changing the visible form layout.
- Minimized Global Error Boundary client logging to structured `name`, `message`, and `digest` metadata instead of logging the full Error object.
- Added explicit `Cache-Control: no-store` headers to export API success and error responses because exports contain personal clip data.
- Added explicit `Cache-Control: no-store` headers to URL title/body fetch API success and error responses.
- Minimized inline tag API responses to `id`, `name`, and `color`, and added explicit `Cache-Control: no-store` headers.
- Hardened tag update/delete actions so zero affected rows are not reported as successful changes.
- Introduced a UI-facing `TagSummary` type and narrowed tag selects so Client Components receive only `id`, `name`, and `color`.
- Switched clip detail create/update/archive feedback to the shared live-region form message component.
- Switched list, favorites, and archive page operation feedback to the shared live-region form message component.
- Added clip-title-specific accessible names to selection-mode checkboxes on clip cards.
- Narrowed clip tag relation reads to `clip_id` and `tag_id` instead of selecting the full `clip_tags` row.
- Added explicit `Cache-Control: no-store` headers to auth callback success and failure redirects.
- Added optional `SITE_URL` support for signup email callback origins while keeping request Origin validation and local fallback behavior.
- Documented optional `SITE_URL` on the setup screen so production signup callback configuration is visible.
- Added explicit `Cache-Control: no-store` headers to middleware auth and setup redirects.
- Added status semantics to the route loading UI with `role="status"`, `aria-live`, and `aria-busy`.
- Replaced the shared archive button fallback labels with Japanese text.
- Replaced the remaining fixed English eyebrow label in the clip form with Japanese copy.
- Replaced the visible route loading label with Japanese copy.
- Replaced export dropdown item labels with Japanese copy while keeping JSON/CSV formats unchanged.
- Removed dialog popup semantics from the export dropdown trigger and linked the open popover with `aria-controls` instead.
- Verification performed: `npm run lint`, `npm run typecheck -- --incremental false`, `npm run check:mojibake`, and `git diff --check`.
- Skipped verification: production build, dev server, browser E2E, live Supabase, and live Gemini were not run in this checkpoint sequence.
- Blocked decisions: rotate any exposed local secrets, decide whether to scrub Git history, decide whether to migrate existing unsafe production URL values, and decide whether to expand Error Boundary messaging or monitoring.
