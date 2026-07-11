# CockroachDB への切り替え手順

Supabase の既存データを引き継がず、CockroachDB を新しい記録先として使用する手順です。

## 1. 接続文字列を設定する

Cockroach Cloud でクラスターとデータベースを作成し、接続文字列を `.env` と Vercel の環境変数に設定します。Prisma CLI は `.env.local` ではなく `.env` を自動読込します。

```env
DATABASE_URL="postgresql://<user>:<password>@<host>:26257/<database>?sslmode=verify-full"
API_SECRET_KEY="<既存値を維持>"
```

## 2. スキーマを作成する

```bash
npm run db:migrate
```

`health_data` と `goals` テーブルが CockroachDB に作成されます。Supabase のデータは移送されません。

## 3. Vercel を切り替える

Vercel の `DATABASE_URL` を CockroachDB の接続文字列に置き換えてデプロイします。以後、iPhone ショートカットから送信されたデータは CockroachDB に保存されます。

目標は `POST /api/goals` で現在の計画に合わせて登録してください。
