-- Add PFC nutrition fields to health_data table
ALTER TABLE "health_data" 
ADD COLUMN IF NOT EXISTS "protein_g" DECIMAL(6, 2),
ADD COLUMN IF NOT EXISTS "fat_g" DECIMAL(6, 2),
ADD COLUMN IF NOT EXISTS "carbohydrate_g" DECIMAL(6, 2),
ADD COLUMN IF NOT EXISTS "fiber_g" DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS "sugar_g" DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS "sodium_mg" DECIMAL(7, 2);