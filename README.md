# Diet Dashboard

iPhoneのヘルスケアデータをネイティブ同期アプリまたは既存ショートカット経由で記録・可視化するダッシュボードです。

## 構成

- Next.js 14 / TypeScript
- Prisma ORM
- CockroachDB
- Vercel

すべてのデータベースアクセスは Prisma に統一しています。`health_data` と `goals` を CockroachDB に保存し、書き込み API は `X-API-Key` またはペアリング済み iPhone の端末トークンで保護します。

## 開発環境の準備

Node.js 22（`package.json` の `engines` 準拠）と CockroachDB の接続文字列を用意します。

```env
# .env （Prisma CLI は .env を読み込む）
DATABASE_URL="postgresql://<user>:<password>@<host>:26257/<database>?sslmode=verify-full"
API_SECRET_KEY="<安全なランダム値>"
# 端末トークン・ペアリングコードのハッシュ専用値。API_SECRET_KEY とは別のランダム値にする
MOBILE_TOKEN_PEPPER="<安全なランダム値>"
# ダッシュボード上で目標を編集するための管理パスワードとセッション署名鍵
DASHBOARD_ADMIN_PASSWORD="<強固な管理パスワード>"
DASHBOARD_SESSION_SECRET="<十分に長いランダム値>"
# ペアリングコードを発行する API のベース URL
MOBILE_API_BASE_URL="https://<app>.vercel.app"
```

```bash
npm install
npm run db:migrate
npm run dev
```

## データベース操作

```bash
# CockroachDB に Prisma のスキーマを適用
npm run db:migrate

```

Supabase の既存データを引き継がない場合は、空の CockroachDB から記録を開始します。目標は `POST /api/goals` で現在の計画に合わせて登録してください。

## API

- `GET /api/health` — 健康データを取得
- `POST /api/health` — 健康データを記録（`X-API-Key` または `Authorization: Bearer <device-token>` が必要）
- `GET /api/goals?active=true` — 有効な目標を取得
- `PUT /api/goals/active` — 現在の減量計画を更新（`X-API-Key` または設定画面の管理セッションが必要）
- `POST /api/admin/mobile-pairing-codes` — 一回限りの iPhone ペアリングコードを発行（`X-API-Key` が必要）
- `GET /api/admin/mobile-devices` / `DELETE /api/admin/mobile-devices/:id` — 接続済み iPhone の確認・失効（`X-API-Key` が必要）

健康データ送信例:

```json
{
  "date": "2026-07-12",
  "weight": 70.5,
  "bodyFatPercentage": 15.2,
  "steps": 8500,
  "activeCalories": 450,
  "restingCalories": 1800
}
```

## 減量計画の設定

`/settings` で管理パスワードを入力すると、目標体重・期限・PFC比率・任意の歩数目標を設定できます。
保存時の直近7日間の体重平均を開始体重として固定し、目標体重との差を `1kg = 7,700kcal` で必要なカロリー赤字へ換算します。摂取カロリー目安は、HealthKitから取得する直近7日間の総消費平均から自動計算されます。

## 検証

```bash
npm test
npm run build
```

## iPhone ネイティブ同期アプリ

[`ios/DietHealthSync`](ios/DietHealthSync) は iOS 26.0 以上を対象にした、HealthKit 同期専用の SwiftUI アプリです。ダッシュボードを置き換えるものではありません。

### 配布前の設定

1. Vercel の Production 環境変数に `MOBILE_TOKEN_PEPPER` を追加し、`npm run db:migrate` を実行します。`API_SECRET_KEY` と同じ値にしないでください。
2. [`Info.plist`](ios/DietHealthSync/Info.plist) の `API_BASE_URL` を Vercel の本番 HTTPS URL に変更します。
3. [`project.pbxproj`](ios/DietHealthSync/DietHealthSync.xcodeproj/project.pbxproj) の `PRODUCT_BUNDLE_IDENTIFIER` を自分の Bundle ID に変更し、Xcode で Signing Team を選択します。
4. Xcode で `ios/DietHealthSync/DietHealthSync.xcodeproj` を開き、HealthKit capability を有効にした上で Archive し、App Store Connect へアップロードして TestFlight を作成します。フル Xcode、Apple Developer Program、App Store Connect の設定が必要です。

アプリは体重・体脂肪率・除脂肪体重・歩数・アクティブエネルギー・安静時エネルギー・摂取カロリー・タンパク質・脂質・炭水化物を**読み取りのみ**で利用します。体組成は各日の最新値、活動量と栄養素は日別合計を送信します。摂取カロリーは HealthKit の記録値を保存し、記録がない場合のみダッシュボードで PFC から推定します。初回と以後の同期では常に過去30日を再集計するため、遅れて到着した HealthKit データも更新できます。バックグラウンド同期は iOS の実行判断に依存し、実行時刻は保証されません。

### 端末のペアリングと失効

本番 URL を設定した PC で、次のコマンドを実行します。コードは既定で10分間だけ有効で、一度使うと無効になります。

```bash
npm run mobile:pair
```

表示されたコードをアプリの初回設定画面で入力します。端末トークンは iPhone の Keychain にのみ保存され、共通 API キーはアプリへ保存しません。

端末一覧の取得と紛失端末の失効は次のように行えます。

```bash
curl -H "X-API-Key: $API_SECRET_KEY" "$MOBILE_API_BASE_URL/api/admin/mobile-devices"
curl -X DELETE -H "X-API-Key: $API_SECRET_KEY" "$MOBILE_API_BASE_URL/api/admin/mobile-devices/<device-id>"
```

## デプロイ

Vercel に `DATABASE_URL`、`API_SECRET_KEY`、`MOBILE_TOKEN_PEPPER` を設定してデプロイします。詳細は [デプロイメントガイド](docs/deployment-guide.md) を参照してください。
