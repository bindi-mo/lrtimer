# Web Push (サーバ側インテグレーション)

このプロジェクトはクライアント側の Push 購読と Service Worker の受信処理を実装しています。バックグラウンド（PWA が閉じているとき）に 15 分・5 分通知を送るにはサーバ側で Web Push を送信する必要があります。

## 必須設定
- 環境変数: `VITE_VAPID_PUBLIC_KEY` (フロントエンドに埋め込む公開鍵)
- サーバ: VAPID 秘密鍵・公開鍵を生成し、購読情報を保存して通知を送信できる API を実装する

## 推奨エンドポイント（例）
- `POST /api/subscribe` - クライアントから購読オブジェクトと `schedules` を受け取り保存（Functions: `functions/subscribe.js` を参照）
- `POST /api/unsubscribe` - 購読解除（Functions: `functions/unsubscribe.js`）
- `POST /api/send` - (内部) 指定 subscription に対して即時送信（Functions: `functions/send.js`）

## サーバ送信ロジック（Cloudflare 構成）
1. **保存**: `functions/subscribe.js` は購読に `schedules`（秒単位）と `timezoneOffset` を保存します（KV: `SUBSCRIPTIONS` を推奨、ローカルでは `data/subscriptions.json` に保存）。
2. **Cron Worker**: `workers/notify-cron.js` を Cron Trigger（毎分）で実行。各購読についてローカル時刻を計算し、目標時刻の **15分前 / 5分前** に該当したら `POST /api/send` を呼び出して通知を送信します。
3. **送信**: `functions/send.js` は `web-push` を使って Push を送ります。VAPID キーは `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` を環境変数で設定します。

Payload 例:
  ```json
  {
    "title": "LR Timer",
    "body": "15分前です",
    "tag": "boss-1234",
    "url": "/"
  }
  ```

## ローカルでのテスト方法
- `.env` に `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` を設定し、`npm install` 後、`node scripts/send-test-push.js` を実行すると `data/subscriptions.json` 中の購読へテスト通知を送れます。
- テスト送信スクリプトは **410 Gone** を検出した購読を自動で削除します（`data/subscriptions.json` のクリーンアップ対応）。同様に、`scripts/send-test-push-kv.js` は送信中に 410 を検出すると `/api/unsubscribe` を呼び出して KV から削除します。

### Cloudflare Pages (wrangler) ローカル開発手順（推奨）
1. wrangler をインストール（まだなら）:
   - `npm i -g wrangler`
2. Cloudflare にログインして設定:
   - `wrangler login`
3. KV Namespace を作成してバインディング ID を取得:
   - `wrangler kv:namespace create SUBSCRIPTIONS` → 出力される ID を `wrangler.toml` の `[[kv_namespaces]].id` にコピー
4. `wrangler.toml` の `account_id` と `[[kv_namespaces]].id` を実際の値に置き換え、必要があれば `VAPID_*` 環境変数を設定する
5. Build と Pages のローカル起動:
   - `npm run build`
   - `npm run wrangler:dev`
   - これで `http://localhost:4174/` にアクセスすると Pages Functions (`/api/*`) がローカルで提供されます
6. ブラウザで `http://localhost:4174/` を開き「🔔 Push 有効化」→ `/api/subscribe` が 200 を返すことを確認する

（注）`vite preview` は Pages Functions を提供しないため `/api/*` は 404 になります。ローカルで `/api/*` をテストするには `wrangler pages dev` を使ってください。

## Cloudflare の設定メモ
- KV Namespace を作成し `SUBSCRIPTIONS` としてバインド
- Pages Functions に `functions/*.js` を配置（`/api/subscribe` 等として動作）
- Worker `workers/notify-cron.js` を Cron Trigger (every 1 minute) で登録
- 環境変数に `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`, オプションで `BASE_ORIGIN` を設定（Worker が `fetch(BASE_ORIGIN + '/api/send')` するため）

## 注意点
- 送信の重複防止: `lastSent` フィールドに日付を保存して重複を防いでいます
- タイムゾーン: フロントは `timezoneOffset` を送信します（getTimezoneOffset を利用）。サーバはこれに合わせて "ローカル" 時刻を算出します。

---
必要なら Cloudflare 用の `wrangler.toml` / デプロイ手順のテンプレートも追加します。
---
参考: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
