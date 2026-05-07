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
- すべての clip / tag / clip_tags の DB 操作は `user_id` でスコープします。
- `/api/fetch-title` と `/api/fetch-content` はログイン済みユーザーのみ利用できます。
- URL 取得 API は `http` / `https` のみ許可し、localhost、loopback、private IP、link-local、巨大レスポンス、長時間応答を拒否します。
- ログイン後の `next` と bulk archive の `returnTo` は内部相対パスだけ許可します。

## 主要ページ

- `/login`: メールとパスワードによるログイン・アカウント作成。
- `/setup`: Supabase 設定不足時の案内。
- `/clips`: 通常の記事一覧。sort / view / tag / month / selection mode / JSON・CSV export を提供。
- `/clips/new`: 記事作成。本文、URL、メモ、画像、タグ、URL タイトル取得、URL 本文取得、インラインタグ作成を提供。
- `/clips/[id]`: 記事詳細。本文、メモ、画像、タグ、元 URL、favorite、archive、AI 要約生成を表示。
- `/clips/[id]/edit`: 記事編集。作成フォームと同等のタグ・画像・取得機能を提供。
- `/favorites`: お気に入り記事一覧。sort / view / tag / selection mode / export を提供。
- `/archive`: アーカイブ済み記事一覧。復元、完全削除、sort / view / tag / export を提供。
- `/calendar`: 年別の月別件数を表示し、月を選ぶと `/clips?year=YYYY&month=M` に遷移します。
- `/tags`: タグ作成、更新、削除、利用件数表示。

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
- 画像は 1 件、最大 5MB、`image/*` のみ受け付けます。

## 入力・取得・要約

- クリップ本文は最大 20,000 文字です。
- メモは最大 4,000 文字です。
- タイトルは必須、最大 160 文字です。
- URL は最大 2,000 文字です。
- URL 取得本文は抽出後 18,000 文字に制限します。
- AI 要約は本文 200 文字以上で実行できます。
- AI 要約は詳細ページだけに表示し、一覧ページには本文を直接表示しません。
- `GEMINI_API_KEY` 未設定時も詳細ページは壊さず、生成できない理由を表示します。
- `GEMINI_MODEL` 未設定時は既定値を使います。

## Export

- `/clips`, `/favorites`, `/archive` は JSON / CSV export を提供します。
- export は scope、sort、tag、month filter を反映します。
- CSV は日本語の文字化けを減らすため UTF-8 BOM 付きで返します。
- クリップ単体 export は一覧 export と同じ payload / CSV column helper を使います。

## 長期運用ルール

- production build は対話作業中に実行しません。確認は `npm run dev`, `npm run lint`, `npm run typecheck -- --incremental false` を基本にします。
- `.next/dev/types/**/*.ts` は `tsconfig.json` の include に入れません。
- 文字化け再発確認は `npm run check:mojibake` で行います。
- 通常保存時の画像 debug log は `CLIP_SAVE_DEBUG=1` のときだけ出します。失敗時の構造化 error log は残します。
- `supabase/schema.sql` の Storage private 化は schema 上の仕様です。既存 live DB へ適用する場合は、事前に重複タグや既存 bucket 設定を確認してから実行します。
