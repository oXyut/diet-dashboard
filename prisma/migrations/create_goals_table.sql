-- Create goals table for tracking diet targets
CREATE TABLE IF NOT EXISTS "goals" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "target_weight_kg" DECIMAL(5, 2),
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "daily_calorie_intake_min" INTEGER,
    "daily_calorie_intake_max" INTEGER,
    "daily_protein_min_g" DECIMAL(6, 2),
    "daily_protein_max_g" DECIMAL(6, 2),
    "daily_fat_min_g" DECIMAL(6, 2),
    "daily_fat_max_g" DECIMAL(6, 2),
    "daily_carb_min_g" DECIMAL(6, 2),
    "daily_carb_max_g" DECIMAL(6, 2),
    "daily_steps_target" INTEGER,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert the current diet goal based on docs/target.md
INSERT INTO "goals" (
    name,
    description,
    target_weight_kg,
    start_date,
    end_date,
    daily_calorie_intake_min,
    daily_calorie_intake_max,
    daily_protein_min_g,
    daily_protein_max_g,
    daily_fat_min_g,
    daily_fat_max_g,
    daily_carb_min_g,
    daily_carb_max_g,
    daily_steps_target,
    is_active
) VALUES (
    'メインダイエット目標',
    '目標体重100kgを目指すダイエット計画',
    100.0,
    '2025-07-26',
    '2025-09-30',
    1600,
    2000,
    90.5,
    158.3,
    40.2,
    60.3,
    203.5,
    271.4,
    8000,
    true
);