# データベースマイグレーション戦略

## 概要

健康データに新しいパラメータ（PFCなど）を逐次追加していくための、Supabaseマイグレーション戦略とデプロイ手順です。

## 基本方針

1. **後方互換性の維持**
   - 新しいカラムはすべてNULLABLEで追加
   - 既存のAPIエンドポイントは動作を維持
   - iPhoneショートカットの更新は任意

2. **段階的なデプロイ**
   - まずDBスキーマを更新
   - 次にAPIを更新（新旧両方のデータを受け入れる）
   - 最後にフロントエンドを更新

## ディレクトリ構造

```
supabase/
├── schema.sql              # 初期スキーマ
├── migrations/             # マイグレーションファイル
│   ├── 001_add_pfc.sql    # PFC追加
│   ├── 002_add_water.sql  # 水分摂取量追加
│   └── ...
└── rollback/              # ロールバックスクリプト
    ├── 001_rollback.sql
    └── ...
```

## マイグレーション命名規則

- フォーマット: `{番号}_{説明}.sql`
- 例: `001_add_pfc.sql`, `002_add_water_intake.sql`
- 番号は3桁のゼロパディング

## PFC追加の例

### 1. マイグレーションSQL (001_add_pfc.sql)

```sql
-- PFC（タンパク質、脂質、炭水化物）カラムを追加
ALTER TABLE health_data
ADD COLUMN protein_g DECIMAL(6,2),
ADD COLUMN fat_g DECIMAL(6,2),
ADD COLUMN carbohydrate_g DECIMAL(6,2);

-- 将来の拡張用（その他の栄養素）
ALTER TABLE health_data
ADD COLUMN fiber_g DECIMAL(5,2),
ADD COLUMN sugar_g DECIMAL(5,2),
ADD COLUMN sodium_mg DECIMAL(7,2);
```

### 2. API更新戦略

**Phase 1: 受け入れのみ（後方互換性維持）**
- 新しいフィールドを受け入れるが、必須ではない
- 既存のiPhoneショートカットは動作を継続

**Phase 2: 表示対応**
- ダッシュボードに新しいメトリクスを表示
- nullの場合は「-」を表示

### 3. 型定義の更新

```typescript
// types/health.ts に追加
export interface NutritionData {
  protein_g?: number | null;
  fat_g?: number | null;
  carbohydrate_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
}
```

## デプロイ手順

### 1. 開発環境でのテスト

```bash
# ローカルでマイグレーションをテスト
supabase db push --db-url "postgresql://..."
```

### 2. 本番環境へのデプロイ

#### Step 1: データベース更新
1. Supabase Dashboardにログイン
2. SQL Editorで`001_add_pfc.sql`を実行
3. 実行結果を確認

#### Step 2: API更新
1. APIコードを更新（新フィールドの受け入れ）
2. Vercelにデプロイ
3. テストエンドポイントで動作確認

#### Step 3: フロントエンド更新
1. ダッシュボードコンポーネントを更新
2. Vercelにデプロイ
3. 表示を確認

### 3. ロールバック手順

問題が発生した場合：

```sql
-- rollback/001_rollback.sql
ALTER TABLE health_data
DROP COLUMN IF EXISTS protein_g,
DROP COLUMN IF EXISTS fat_g,
DROP COLUMN IF EXISTS carbohydrate_g,
DROP COLUMN IF EXISTS fiber_g,
DROP COLUMN IF EXISTS sugar_g,
DROP COLUMN IF EXISTS sodium_mg;
```

## マイグレーション記録

実行したマイグレーションを記録：

```sql
-- マイグレーション履歴テーブル（オプション）
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_by VARCHAR(255),
  success BOOLEAN DEFAULT true,
  notes TEXT
);
```

## 今後の拡張候補

- 水分摂取量 (water_ml)
- 睡眠時間 (sleep_hours, sleep_quality)
- 血圧 (blood_pressure_systolic, blood_pressure_diastolic)
- 心拍数 (heart_rate_resting, heart_rate_max)
- 運動記録 (exercise_type, exercise_duration_min)
- 食事タイミング (meal_timing)
- サプリメント摂取記録

## ベストプラクティス

1. **小さな変更を頻繁に**
   - 大きな変更より小さな変更を複数回
   - 各マイグレーションは1つの機能に集中

2. **テストの重要性**
   - 開発環境で必ずテスト
   - APIの後方互換性を確認

3. **ドキュメント化**
   - 各マイグレーションの目的を記録
   - iPhoneショートカットの更新手順も記録

4. **モニタリング**
   - エラーログを監視
   - パフォーマンスへの影響を確認