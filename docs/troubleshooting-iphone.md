# iPhoneショートカット トラブルシューティング

## エラー: "No API key found in request"

このエラーが出る場合、ショートカットがSupabaseに直接アクセスしている可能性があります。

### 確認事項

1. **URLが正しいか確認**
   - ❌ 間違い: `https://xxx.supabase.co/rest/v1/health_data`
   - ✅ 正しい: `https://your-app.vercel.app/api/health`

2. **ヘッダーの設定**
   ```
   Content-Type: application/json
   X-API-Key: your_custom_api_key
   ```

### デバッグ手順

1. **テストエンドポイントで確認**
   - URL: `https://your-app.vercel.app/api/test`
   - メソッド: POST
   - ヘッダー: Content-Type: application/json
   - 本文: {"test": "data"}

2. **レスポンスを確認**
   - 成功: `{"status": "received", ...}`
   - 失敗: エラーメッセージを確認

### ショートカットの正しい設定

1. **URLの内容を取得**アクション
   - URL: `https://your-app.vercel.app/api/health`（VercelのURL）
   - メソッド: POST
   - ヘッダー:
     - Content-Type: application/json
     - X-API-Key: [環境変数で設定したAPI_SECRET_KEY]
   - 本文: JSON（辞書から）

### よくある間違い

1. **Supabase URLを直接使用**
   - SupabaseのURLではなく、VercelでホストされているアプリのURLを使用

2. **ヘッダー名の間違い**
   - `apikey` ではなく `X-API-Key` を使用

3. **本文の形式**
   - 「テキスト」ではなく「JSON」を選択