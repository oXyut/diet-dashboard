# iPhoneショートカット トラブルシューティング

## エラー: "No API key found in request"

このエラーが出る場合、ショートカットの URL または API キー設定が誤っている可能性があります。

### 確認事項

1. **URLが正しいか確認**
   - ❌ 間違い: データベースの接続 URL や SQL Console の URL
   - ✅ 正しい: `https://your-app.vercel.app/api/health`

2. **ヘッダーの設定**
   ```
   Content-Type: application/json
   X-API-Key: your_custom_api_key
   ```

### デバッグ手順

1. **認証付きで API を確認**（`/api/test` は廃止済み）
   - URL: `https://your-app.vercel.app/api/health`
   - メソッド: GET
   - ヘッダー: X-API-Key: [API_SECRET_KEY]

2. **レスポンスを確認**
   - 成功: `{"data": [...]}`
   - 401: API キーの設定ミスを確認

### ショートカットの正しい設定

1. **URLの内容を取得**アクション
   - URL: `https://your-app.vercel.app/api/health`（VercelのURL）
   - メソッド: POST
   - ヘッダー:
     - Content-Type: application/json
     - X-API-Key: [環境変数で設定したAPI_SECRET_KEY]
   - 本文: JSON（辞書から）

### よくある間違い

1. **データベース URL を直接使用**
   - CockroachDB の接続 URL ではなく、VercelでホストされているアプリのURLを使用

2. **ヘッダー名の間違い**
   - `apikey` ではなく `X-API-Key` を使用

3. **本文の形式**
   - 「テキスト」ではなく「JSON」を選択
