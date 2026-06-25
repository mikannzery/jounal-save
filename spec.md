# CLIP MEMO Spec

## 概要

CLIP MEMO は、ログインユーザーが記事本文、URL、メモ、タグ、画像、AI 要約を保存して後から読み返すための個人用アーカイブです。

## 技術構成

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Database
- Supabase Storage
- Gemini API による詳細ページの AI 要約

## 認証と保護

- Supabase 環境変数が未設定の場合は `/setup` に誘導します。
- 未ログインユーザーは `/clips`, `/favorites`, `/archive`, `/calendar`, `/tags` を利用できません。
- 認証失敗時は Supabase の raw error message をユーザーへ表示せず、安全な汎用文言を返します。詳細は秘密情報を含まない server log に限定します。
- signup email redirect の callback origin は、任意の `SITE_URL` が有効な `http` / `https` URL の場合はそれを優先し、未設定時は request `Origin` を検証して使います。不正な値は local fallback にします。
- auth callback は code がない場合や session exchange に失敗した場合、code をログせず `/login?error=callback` へ戻し、ログイン画面に安全なエラー文言を表示し、失敗メタデータだけを server log に残します。callback の成功・失敗 redirect は `Cache-Control: no-store` を明示します。
- すべての clip / tag / clip_tags の DB 操作は `user_id` でスコープします。
- `clip_tags` の insert RLS は、関連付ける clip と tag の両方がログインユーザー所有であることを確認します。
- `/api/fetch-title` と `/api/fetch-content` はログイン済みユーザーのみ利用できます。
- URL 取得 API は `http` / `https` のみ許可し、localhost、loopback、private IP、IPv4-mapped IPv6 の private / loopback、link-local、特殊用途 IP、巨大レスポンス、長時間応答を拒否します。
- ログイン後の `next` と bulk archive の `returnTo` は内部相対パスだけ許可します。
- 未ログインで保護ルートへアクセスした場合、ログイン後の `next` は path と query string を保持します。
- Middleware の認証・セットアップ redirect は `Cache-Control: no-store` を明示します。

## 主要ページ

- `/login`: メールとパスワードによるログイン・アカウント作成。
- `/setup`: Supabase 設定不足時の案内。任意の `SITE_URL` 設定例も表示します。
- `/clips`: 通常の記事一覧。sort / view / tag / month / selection mode / JSON・CSV export を提供。
- `/clips/new`: 記事作成。本文、URL、メモ、画像、タグ、URL タイトル取得、URL 本文取得、インラインタグ作成を提供。
- `/clips/[id]`: 記事詳細。本文、メモ、画像、タグ、元 URL、favorite、archive、AI 要約生成を表示。
- `/clips/[id]/edit`: 記事編集。作成フォームと同等のタグ・画像・取得機能を提供。
- `/favorites`: お気に入り記事一覧。sort / view / tag / selection mode / export を提供。
- `/archive`: アーカイブ済み記事一覧。復元、完全削除、sort / view / tag / export を提供。
- `/calendar`: 年別の月別件数を表示し、月を選ぶと `/clips?year=YYYY&month=M` に遷移します。
- `/calendar?year=` は 2000 から 9999 の整数だけを対象年として受け付け、範囲外や不正値は現在年へフォールバックします。
- `/tags`: タグ作成、更新、削除、利用件数表示。
- 同名タグが同時作成された場合は、unique violation を通常の作成失敗として扱わず、作成済みの owned tag を再取得して利用します。
- インラインタグ作成 API は、クライアントに必要な `id`, `name`, `color` だけを返し、成功・失敗レスポンスに `Cache-Control: no-store` を明示します。
- UI に渡すタグデータは、表示に必要な `id`, `name`, `color` に限定し、DB行全体を Client Component に渡さないようにします。
- クリップにタグを付与する内部取得では、`clip_tags` から必要な `clip_id`, `tag_id` だけを取得します。
- 完全削除とタグ削除は、対象名と影響範囲を含む確認を経てから実行します。
- 共通ボタン、入力欄、テキストエリア、ヘッダーリンクはキーボード操作時に見える `focus-visible` 表示を持ちます。
- Export dropdown は本格的な menu / dialog role ではなく、開閉可能なポップオーバー内の通常リンク/ボタンとして扱います。
- フォームの非同期成功・エラーメッセージは live region として支援技術へ通知されます。
- タグ管理の作成・更新・削除結果も共通フォームメッセージとして表示し、成功は status、失敗は alert として通知します。
- 記事詳細の作成・更新結果やアーカイブ失敗も共通フォームメッセージとして表示し、成功は status、失敗は alert として通知します。
- 一覧・お気に入り・アーカイブページの操作結果も共通フォームメッセージとして表示し、成功は status、失敗は alert として通知します。
- ルート読み込み表示は `role="status"` と `aria-busy` で読み込み中であることを支援技術へ伝えます。
- `Field` が直接の入力要素を持つ場合、ラベルは `htmlFor` で入力へ接続し、説明文とエラー文は `aria-describedby` で入力へ接続され、エラー時は `aria-invalid` を付けます。
- タグのインライン編集入力は、表示ラベルがない場合でも `aria-label` で操作対象を示します。
- 画像貼り付け領域などのフォーカス可能な非フォーム要素は、操作対象が分かるアクセシブル名を持ちます。
- 一覧カードの選択チェックボックスは、対象記事が分かるアクセシブル名を持ちます。
- 詳細タイトル、本文、メモ、タグ表示は長い URL や連続文字列で横 overflow しないよう折り返します。
- 認証、作成・編集フォーム、設定画面、エラー画面、URL取得、画像、タグ作成の主要ユーザー向け文言は日本語を基本にします。

## データモデル

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

## ストレージ

- 画像は Supabase Storage の `clip-images` bucket に保存します。
- bucket は private とし、表示時は signed URL を生成します。
- 画像 path は `userId/random-file-name` 形式です。
- 画像 path の元ファイル名由来部分は、制御しやすい ASCII 文字へ正規化し、空名にならないよう fallback し、長さを制限します。
- 画像は 1 件、最大 5MB、`image/*` のみ受け付けます。

## 入力・取得・要約

- クリップ本文は最大 20,000 文字です。
- メモは最大 4,000 文字です。
- タイトルは必須、最大 160 文字です。
- URL は最大 2,000 文字です。
- 保存 URL は空欄または `http` / `https` のみ許可します。既存データにその他の scheme が残っていても、画面では外部リンクとして描画しません。
- 外部URLリンクは `safeUrl` として検証できる場合だけ描画し、新規タブでは `noreferrer noopener` を付けます。
- URL 取得本文は抽出後 18,000 文字に制限します。
- URL タイトル取得・本文取得のレスポンスは、取得開始時の URL と現在の入力 URL が一致する場合だけフォームへ反映します。
- URL タイトル取得・本文取得の運用系失敗は、URL全文をログせず、定数化した失敗コードだけをサーバーログへ残します。
- URL タイトル取得・本文取得 API は、成功・失敗レスポンスに `Cache-Control: no-store` を明示します。
- AI 要約は本文 200 文字以上で実行できます。
- AI 要約は詳細ページだけに表示し、一覧ページには本文を直接表示しません。
- AI 要約の対象 clip 取得は 0 件と DB エラーを区別し、DB エラー時は安全な文言を返してサーバーログに失敗情報を残します。
- `GEMINI_API_KEY` 未設定時も詳細ページは壊さず、生成できない理由を表示します。
- `GEMINI_MODEL` 未設定時は既定値を使います。
- Gemini API の raw error message はユーザーへ直接表示せず、サーバーログに最小限の失敗情報を残し、UI には安全な汎用文言を返します。

## Export

- `/clips`, `/favorites`, `/archive` は JSON / CSV export を提供します。
- export は scope、sort、tag、month filter を反映します。
- CSV は日本語の文字化けを減らすため UTF-8 BOM 付きで返します。
- CSV はスプレッドシートで式として解釈され得る先頭文字を、出力時だけ文字列扱いになるよう保護します。
- クリップ単体 export は一覧 export と同じ payload / CSV column helper を使います。
- クリップ単体 export は `/api/export?scope=clip&id=...` 経由で取得し、一覧カードの Client Component へ clip 本文・メモ・AI 要約などの export 用全データを渡しません。
- 通常 export は内部 Storage path を含めず、画像の有無を `has_image` として出力します。
- export の `Content-Disposition` filename は、制御文字を除去し、長さを制限し、UTF-8 filename を `filename*` として返します。
- export API は個人データを返すため、成功・失敗レスポンスに `Cache-Control: no-store` を明示します。

## 長期運用ルール

- production build は対話作業中に実行しません。確認は `npm run dev`, `npm run lint`, `npm run typecheck -- --incremental false` を基本にします。
- `.next/dev/types/**/*.ts` は `tsconfig.json` の include に入れません。
- 文字化け再発確認は `npm run check:mojibake` で行い、主要な source / docs / schema / metadata ファイルを対象にします。
- `step4-quality-summary.json` のような一時検証結果はローカル生成物として扱い、Git 追跡対象にしません。
- 通常保存時の画像 debug log は `CLIP_SAVE_DEBUG=1` のときだけ出します。失敗時の構造化 error log は残します。
- `supabase/schema.sql` の Storage private 化は schema 上の仕様です。既存 live DB へ適用する場合は、事前に重複タグや既存 bucket 設定を確認してから実行します。
- `.env.local` はローカル設定ファイルとして扱い、Git 追跡対象にしません。履歴やリモートに含まれた値のローテーションは別途運用判断として扱います。
- clip 詳細取得は、0 件のみ not found とし、Supabase の取得エラーはサーバーログに `message`, `code`, `details`, `hint` を残して Error Boundary 側へ送ります。
- Global Error Boundary はユーザーに安全な固定文言を表示し、ブラウザ console へは Error オブジェクト全体ではなく最小限の構造化メタデータだけを出します。
- archive、bulk archive、restore、delete、favorite の状態変更は、対象 clip が 0 件の場合に成功扱いしてはいけません。
- タグ更新・削除も対象 tag が 0 件の場合に成功扱いしてはいけません。

## 2026-05-20 edit save stability

- `/clips/[id]/edit` の保存成功後は、clip 一覧系の再検証として `/clips`, `/favorites`, `/archive` を明示的に `revalidatePath` します。再検証ヘルパーは自分自身を呼び出してはいけません。
- 編集保存時に対象 clip が 0 件になる可能性がある読み取り・更新は `.maybeSingle()` を使い、0 件時は Error Boundary ではなくフォーム内の安全なエラー文言で返します。
- insert 後に返却行を読む create clip / create tag 処理も `.maybeSingle()` を使い、返却行がない場合は通常の保存失敗として扱います。
- clip 保存の Supabase / Storage 失敗は、サーバーログに `message`, `code`, `details`, `hint` を含む構造化情報を残し、ユーザーには秘密や内部詳細を含まない文言だけを返します。
- clip list/detail data access の Supabase 失敗は、サーバーログに `message`, `code`, `details`, `hint` を含む構造化情報を残します。
- clip tag replacement の Supabase 失敗も、同じく `message`, `code`, `details`, `hint` を含む構造化情報をサーバーログへ残します。
- tag data access の Supabase 失敗も、同じく `message`, `code`, `details`, `hint` を含む構造化情報をサーバーログへ残します。
- tagIds が空の場合は `clip_tags.insert([])` を行わず、image path が null / undefined の場合は Storage 削除や signed URL 生成をスキップします。

## 2026-05-20 additional hardening

- URL title/body fetching must validate the initial URL and every redirect target before reading HTML. Redirects to private, loopback, link-local, unsupported-scheme, or too-many-hop targets are rejected.
- Clip tag replacement uses owned tag validation and diff-based `clip_tags` updates. Existing tag links must not be deleted before a required insert has succeeded.
- If clip creation succeeds but tag replacement fails, the partially created clip and uploaded image are cleaned up when possible, and cleanup failures are logged server-side.
- Generated logs, cookies, TypeScript build info, and temporary pager output are not repository source files and should not be committed.

## 2026-05-20 performance notes

- `/calendar` loads only `created_at` values for the selected year and builds monthly counts from that reduced result set.
- `supabase/schema.sql` includes indexes for common authenticated clip list filters and sorts: active/archive by `updated_at` and title, plus the existing created/favorite/tag indexes.

## 2026-06-23 staged hardening

- `.env.local` must remain present only as a local file and must not be tracked by Git.
- Clip URL validation and rendering must reject unsafe schemes such as `javascript:`, `mailto:`, and `ftp:`. Only `http` and `https` URLs may be saved as source links.
- Existing unsafe URL values are not migrated automatically in this stage; they are simply not rendered as clickable external links.
- Clip detail loading must distinguish between a missing clip and a Supabase read failure. Missing clips render not-found, while read failures are treated as operational errors.
- Calendar year parsing must reject non-integer or out-of-range values before date range construction and fall back to the current year.
- Clip state-changing actions must request affected rows from Supabase and treat zero affected rows as a failed or ignored operation instead of reporting success.
- Destructive UI actions such as permanent clip delete and tag delete must require explicit confirmation and use a visually distinct danger control.
- Shared interactive controls must keep visible keyboard focus indicators without relying on hover-only feedback.
- Local Supabase schema requires both clip ownership and tag ownership for `clip_tags` inserts. Applying this to a live database requires an explicit migration decision.
- Normal JSON/CSV export must not expose internal `image_path`; it should expose only `has_image` unless a separate full backup export is explicitly designed.
- URL fetch responses must not overwrite the form when the user has changed the URL or started a newer fetch request.
- Inline and tag-page creation should recover from same-user duplicate tag races by reloading the existing owned tag after a database unique violation.
- Auth actions must not expose provider raw error messages to users.
- Protected-route login redirects must preserve the original internal path and query string.
- Export dropdown accessibility metadata must match the implemented interaction model; do not declare menu semantics without menu keyboard behavior.
- Single-clip export should use the export API and pass only the clip id to client-side card controls.
- Long free-text fields and tag labels should wrap within their containers on narrow screens.
- Shared form messages should expose success and error updates via appropriate live-region roles.
- Direct field controls should connect labels with `htmlFor`, connect helper/error text with `aria-describedby`, and avoid wrapping compound interactive controls in a single `<label>`.
- Primary user-facing copy should remain Japanese unless it is a deliberate product label.
- Blocked operational decisions: rotate any values that may have existed in tracked `.env.local`, scrub Git history if required, and decide whether to migrate existing unsafe URL data in production.
