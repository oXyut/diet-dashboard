# デプロイメントガイド

## 前提条件
- Supabaseアカウント
- Vercelアカウント（GitHubアカウント連携）

## 1. Supabaseセットアップ

### プロジェクト作成
1. [supabase.com](https://supabase.com) にログイン
2. 「New project」をクリック
3. プロジェクト名: `diet-dashboard`
4. データベースパスワードを設定（安全に保管）
5. リージョン: Northeast Asia (Tokyo) を選択

### データベース設定
1. SQL Editorを開く
2. `supabase/schema.sql` の内容を貼り付けて実行

### API情報の取得
1. Settings → API
2. 以下をコピー:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Vercelデプロイ

### リポジトリ準備
```bash
git add .
git commit -m "Add Supabase integration"
git push origin main
```

### Vercelでのデプロイ
1. [vercel.com](https://vercel.com) にログイン
2. 「New Project」
3. GitHubリポジトリをインポート
4. 環境変数を設定:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   API_SECRET_KEY=your_custom_api_key
   ```
5. 「Deploy」をクリック

## 3. iPhoneショートカットの更新

### APIキーの追加
1. ショートカットを編集
2. 「URLの内容を取得」のヘッダーに追加:
   - X-API-Key: your_custom_api_key

### URLの変更
- 変更前: `http://192.168.x.x:3000/api/health`
- 変更後: `https://your-app.vercel.app/api/health`

## 4. 動作確認

### データ送信テスト
1. iPhoneショートカットを実行
2. Vercelのログでリクエストを確認
3. Supabaseダッシュボードでデータを確認

### ダッシュボード確認
1. `https://your-app.vercel.app` にアクセス
2. データが表示されることを確認

## トラブルシューティング

### CORS エラー
- Vercelの環境変数が正しく設定されているか確認

### 認証エラー (401)
- API_SECRET_KEYが一致しているか確認
- ショートカットのX-API-Keyヘッダーを確認

### データベース接続エラー
- Supabaseの認証情報を再確認
- Supabaseプロジェクトが起動しているか確認