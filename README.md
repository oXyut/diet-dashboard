# Diet Dashboard

iPhoneのヘルスケアデータをショートカット経由で記録・可視化するダッシュボードです。

## 構成

- Next.js 14 / TypeScript
- Prisma ORM
- CockroachDB
- Vercel

すべてのデータベースアクセスは Prisma に統一しています。`health_data` と `goals` を CockroachDB に保存し、書き込み API は `X-API-Key` で保護します。

## 開発環境の準備

Node.js 18 以上と CockroachDB の接続文字列を用意します。

```env
# .env （Prisma CLI は .env を読み込む）
DATABASE_URL="postgresql://<user>:<password>@<host>:26257/<database>?sslmode=verify-full"
API_SECRET_KEY="<安全なランダム値>"
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
- `POST /api/health` — 健康データを記録（`X-API-Key` が必要）
- `GET /api/goals?active=true` — 有効な目標を取得
- `POST /api/goals` — 目標を作成（`X-API-Key` が必要）

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

## 検証

```bash
npm test
npm run build
```

## デプロイ

Vercel に `DATABASE_URL` と `API_SECRET_KEY` を設定してデプロイします。詳細は [デプロイメントガイド](docs/deployment-guide.md) を参照してください。
