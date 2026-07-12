ALTER TABLE "goals"
  ADD COLUMN IF NOT EXISTS "starting_weight_kg" DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS "protein_target_percent" DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS "fat_target_percent" DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS "carbohydrate_target_percent" DECIMAL(5, 2);

-- 旧目標はグラム・カロリー範囲を前提としているため、新しい計画としては再設定を求める。
UPDATE "goals"
SET "is_active" = false
WHERE "is_active" = true
  AND "starting_weight_kg" IS NULL;
