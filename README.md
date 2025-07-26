# ダイエットダッシュボード

iPhoneのヘルスケアアプリと連携して、日々の健康データを可視化するWebダッシュボードです。

![Dashboard Screenshot](docs/images/dashboard-screenshot.png)

## 機能

- 📊 体重・体脂肪率の推移グラフ
- 🚶 日々の歩数表示
- 🔥 消費カロリーの追跡
- 📱 iPhoneショートカットアプリとの連携
- 📝 手動データ入力フォーム
- 🔄 5秒ごとの自動更新

## 技術スタック

- **フロントエンド**: Next.js 14, React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **グラフ**: Recharts
- **データ保存**: ローカルJSONファイル

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

起動時に以下の情報が表示されます：
```
========================================
ダイエットダッシュボード起動情報
========================================
ローカルアクセス: http://localhost:3000
iPhoneからアクセス: http://192.168.x.x:3000
API エンドポイント: http://192.168.x.x:3000/api/health
========================================
```

### 3. iPhoneショートカットの設定

[docs/shortcut-setup.md](docs/shortcut-setup.md) を参照してください。

## 使い方

### データの自動送信（推奨）

1. iPhoneショートカットを設定
2. 毎日指定時刻に自動実行
3. ダッシュボードで結果を確認

### 手動データ入力

1. ダッシュボード右上の「データ入力」ボタンをクリック
2. フォームに健康データを入力
3. 保存ボタンで送信

## API仕様

### POST /api/health

健康データを保存します。

**リクエストボディ:**
```json
{
  "date": "2025-01-26",
  "weight": 65.5,
  "bodyFatPercentage": 20.5,
  "muscleMass": 50.2,
  "steps": 10000,
  "activeCalories": 300,
  "restingCalories": 1500
}
```

**レスポンス:**
```json
{
  "id": "1234567890",
  "date": "2025-01-26",
  "weight": 65.5,
  "bodyFatPercentage": 20.5,
  "muscleMass": 50.2,
  "steps": 10000,
  "activeCalories": 300,
  "restingCalories": 1500,
  "totalCalories": 1800,
  "createdAt": "2025-01-26T12:00:00.000Z",
  "updatedAt": "2025-01-26T12:00:00.000Z"
}
```

### GET /api/health

保存されている全ての健康データを取得します。

## データ管理

- データは `data/health-data.json` に保存されます
- 日付ごとに1レコード（同じ日付のデータは上書き）
- null値と0値を区別（未記録 vs 実際の0）

## 開発

### ビルド

```bash
npm run build
```

### リント

```bash
npm run lint
```

## トラブルシューティング

### iPhoneから接続できない

1. PCとiPhoneが同じWi-Fiネットワークにいることを確認
2. ファイアウォール設定を確認
3. 表示されたIPアドレスが正しいか確認

### データが表示されない

1. `data/health-data.json` が存在するか確認
2. ブラウザの開発者ツールでエラーを確認
3. APIエンドポイントに直接アクセスしてレスポンスを確認

## ライセンス

MIT License