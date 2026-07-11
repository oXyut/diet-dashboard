# CockroachDB のスキーマ移行戦略

## 方針

スキーマ変更は Prisma のマイグレーションとして `prisma/migrations/<timestamp>_<description>/migration.sql` に追加します。新しいカラムは原則 nullable で追加し、API と iPhone ショートカットの後方互換性を保ちます。

## 開発時

開発用 CockroachDB に対してマイグレーションを作成し、生成された SQL を確認します。

```bash
npx prisma migrate dev --name add_water_intake
```

## 本番適用

本番の `DATABASE_URL` を設定した CI またはローカル環境で実行します。

```bash
npm run db:migrate
```

`migrate deploy` は未適用のマイグレーションだけを順番に実行します。適用前には CockroachDB のバックアップまたは Cloud の復元ポイントを確認してください。

## PFC カラム

PFC と追加栄養素は初期 CockroachDB マイグレーションに含まれています。既存の CockroachDB 環境へ個別に追加する場合は、Prisma スキーマを更新して新しいマイグレーションを作成してください。
