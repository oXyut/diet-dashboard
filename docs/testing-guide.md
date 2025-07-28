# Clean Architecture Testing Guide

## テストの実行手順

### 1. 開発サーバーの起動

```bash
npm run dev
```

サーバーが起動すると以下の情報が表示されます：
```
========================================
ダイエットダッシュボード起動情報
========================================
ローカルアクセス: http://localhost:3000
iPhoneからアクセス: http://192.168.11.11:3000
API エンドポイント: http://192.168.11.11:3000/api/health
========================================
```

### 2. 自動テストスクリプトの実行

```bash
node test-clean-architecture.js
```

このスクリプトは以下をテストします：
- GET /api/health（データ取得）
- POST /api/health（データ投稿）
- iPhone風のリクエスト（スペース付きキー、異なる日付形式）

### 3. 手動テスト

#### 3.1 GET リクエスト（ブラウザまたはcurl）

```bash
curl http://localhost:3000/api/health
```

期待される結果：
```json
{
  "data": [
    {
      "id": "uuid",
      "date": "2025-07-28",
      "weight": 70.5,
      "bodyFatPercentage": 15.2,
      ...
    }
  ]
}
```

#### 3.2 POST リクエスト（curl）

```bash
curl -X POST http://localhost:3000/api/health \
  -H "Content-Type: application/json" \
  -H "X-API-Key: kdVPgiw5YHA3i6MEoH5tXFmGXAxPuzkOBjbZAqzpk1E" \
  -d '{
    "date": "2025-07-28",
    "weight": 70.5,
    "bodyFatPercentage": 15.2,
    "steps": 8500
  }'
```

### 4. ダッシュボードのテスト

ブラウザで http://localhost:3000 にアクセスして：

- [ ] データが正しく表示される
- [ ] グラフが描画される
- [ ] 5秒ごとの自動更新が動作する
- [ ] null値が「-」として表示される

### 5. iPhoneからのテスト

**注意**: この段階でのiPhoneテストが必要です！

#### 5.1 iPhoneのショートカット設定

1. ショートカットアプリを開く
2. 新しいショートカットを作成
3. 「URLの内容を取得」アクションを追加
4. 設定：
   - URL: `http://192.168.11.11:3000/api/health`
   - メソッド: POST
   - ヘッダー:
     - `Content-Type: application/json`
     - `X-API-Key: kdVPgiw5YHA3i6MEoH5tXFmGXAxPuzkOBjbZAqzpk1E`
   - 本文: 以下のJSON
     ```json
     {
       "date": "2025-07-28",
       "weight": 70.5,
       "bodyFatPercentage": 15.2,
       "steps": 8500,
       "activeCalories": 450,
       "restingCalories": 1800
     }
     ```

#### 5.2 iPhone テストの実行

1. ショートカットを実行
2. 開発者コンソールでログを確認
3. ダッシュボードでデータが更新されることを確認

期待されるログ：
```
=== API Health POST Request (Clean Architecture) ===
Raw body: { "date": "2025-07-28", ... }
Normalized body: { "date": "2025-07-28", ... }
Data saved successfully
==============================
```

## トラブルシューティング

### 1. Prismaエラー

```
PrismaClientInitializationError
```

**対処法**:
```bash
npx prisma generate
```

### 2. データベース接続エラー

**対処法**:
- .envファイルのDATABASE_URLを確認
- Supabaseの接続状況を確認

### 3. バリデーションエラー

```json
{
  "error": "Validation failed",
  "details": [...]
}
```

**対処法**:
- リクエストボディの形式を確認
- 必須フィールドが含まれているか確認

### 4. 認証エラー

```json
{
  "error": "Unauthorized"
}
```

**対処法**:
- X-API-Keyヘッダーが正しく設定されているか確認
- API_SECRET_KEYの値を確認

## 成功基準

以下がすべて成功すればクリーンアーキテクチャの移行完了：

- [ ] 自動テストスクリプトがすべて成功
- [ ] ダッシュボードでデータが正しく表示
- [ ] iPhoneからのPOSTが成功
- [ ] エラーハンドリングが適切に動作
- [ ] ログが詳細に出力される
- [ ] パフォーマンスが旧実装と同程度

## iPhone テストが必要な理由

iPhoneショートカットは独特のリクエスト形式を送信するため：

1. **Content-Type**: `text/plain`で送信されることがある
2. **日付形式**: `2025/07/28 14:30`のような形式
3. **キー名**: スペースが含まれる場合がある（` bodyFatPercentage`）
4. **データ型**: 数値が文字列として送信される

これらはローカルテストでは再現困難なため、実際のiPhoneでのテストが必要です。

## 次のステップ

テスト成功後：
1. develop ブランチにマージ
2. 本番環境での段階的デプロイ
3. 旧コードの削除
4. PFC栄養素機能の追加