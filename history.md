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
