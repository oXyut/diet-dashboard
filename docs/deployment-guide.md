# デプロイメントガイド

## 前提条件

- CockroachDB Cloud のクラスターとデータベース
- Vercel アカウント

## 1. CockroachDB の設定

CockroachDB Cloud でクラスターを作成し、アプリケーション用 SQL ユーザーを発行します。接続文字列は `sslmode=verify-full` を含むものを使用します。

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>:26257/<database>?sslmode=verify-full" npm run db:migrate
```

既存データを引き継がない場合は、スキーマ適用後に新しい記録として運用を開始できます。

## 2. Vercel へのデプロイ

Vercel の Production と Preview に次の環境変数を設定します。

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:26257/<database>?sslmode=verify-full
API_SECRET_KEY=<安全なランダム値>
```

Git リポジトリを Vercel に接続してデプロイします。ビルド時に Prisma Client が生成されます。

## 3. 動作確認

1. `https://<app>.vercel.app/api/health` が JSON を返すことを確認します。
2. iPhone ショートカットから `POST /api/health` を実行します。
3. CockroachDB の SQL Console で `SELECT count(*) FROM health_data;` を実行し、データの追加を確認します。

## トラブルシューティング

### データベース接続エラー

- `DATABASE_URL` が CockroachDB の接続文字列か確認します。
- CockroachDB Cloud のネットワークアクセス許可に Vercel の実行元を追加します。
- 接続文字列に `sslmode=verify-full` が含まれているか確認します。
