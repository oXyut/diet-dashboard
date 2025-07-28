# PFC機能デプロイメントガイド

## 概要
このドキュメントでは、PFC（タンパク質、脂質、炭水化物）栄養素トラッキング機能をデプロイする手順を説明します。

## デプロイ手順

### 1. データベースマイグレーション

Supabaseデータベースに以下のSQLを実行してください：

```sql
-- Add PFC nutrition fields to health_data table
ALTER TABLE "health_data" 
ADD COLUMN IF NOT EXISTS "protein_g" DECIMAL(6, 2),
ADD COLUMN IF NOT EXISTS "fat_g" DECIMAL(6, 2),
ADD COLUMN IF NOT EXISTS "carbohydrate_g" DECIMAL(6, 2),
ADD COLUMN IF NOT EXISTS "fiber_g" DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS "sugar_g" DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS "sodium_mg" DECIMAL(7, 2);
```

実行方法：
1. Supabaseダッシュボードにログイン
2. SQL Editorを開く
3. 上記のSQLを貼り付けて実行

### 2. コードのデプロイ

```bash
# mainブランチにマージ
git checkout main
git merge feature/pfc-nutrition

# Vercelにプッシュ（自動デプロイ）
git push origin main
```

### 3. 動作確認

デプロイ後、以下の機能が利用可能になります：

1. **iPhoneショートカットからのPFCデータ送信**
   ```json
   {
     "date": "2025-07-28",
     "weight": 70.5,
     "proteinG": 120.5,
     "fatG": 65.3,
     "carbohydrateG": 250.8,
     "fiberG": 25.2,
     "sugarG": 45.6,
     "sodiumMg": 2300
   }
   ```

2. **ダッシュボードでのPFC表示**
   - タンパク質、脂質、炭水化物の最新値カード
   - PFC推移グラフ

## 新しいフィールド

| フィールド名 | 型 | 説明 |
|------------|---|------|
| proteinG | Decimal(6,2) | タンパク質（グラム） |
| fatG | Decimal(6,2) | 脂質（グラム） |
| carbohydrateG | Decimal(6,2) | 炭水化物（グラム） |
| fiberG | Decimal(5,2) | 食物繊維（グラム） |
| sugarG | Decimal(5,2) | 糖質（グラム） |
| sodiumMg | Decimal(7,2) | ナトリウム（ミリグラム） |

## 注意事項

- すべてのPFCフィールドはオプショナル（nullable）です
- 既存のデータには影響しません
- iPhoneショートカットは既存のものをそのまま使用可能（新フィールドは無視されます）