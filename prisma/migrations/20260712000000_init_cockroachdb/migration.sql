CREATE TABLE "health_data" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "date" DATE NOT NULL,
  "weight" DECIMAL(5, 2),
  "body_fat_percentage" DECIMAL(4, 2),
  "muscle_mass" DECIMAL(5, 2),
  "steps" INT4,
  "active_calories" INT4,
  "resting_calories" INT4,
  "total_calories" INT4,
  "protein_g" DECIMAL(6, 2),
  "fat_g" DECIMAL(6, 2),
  "carbohydrate_g" DECIMAL(6, 2),
  "fiber_g" DECIMAL(5, 2),
  "sugar_g" DECIMAL(5, 2),
  "sodium_mg" DECIMAL(7, 2),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "health_data_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "health_data_date_key" UNIQUE ("date")
);

CREATE TABLE "goals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" STRING(100) NOT NULL,
  "description" STRING,
  "target_weight_kg" DECIMAL(5, 2),
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "daily_calorie_intake_min" INT4,
  "daily_calorie_intake_max" INT4,
  "daily_protein_min_g" DECIMAL(6, 2),
  "daily_protein_max_g" DECIMAL(6, 2),
  "daily_fat_min_g" DECIMAL(6, 2),
  "daily_fat_max_g" DECIMAL(6, 2),
  "daily_carb_min_g" DECIMAL(6, 2),
  "daily_carb_max_g" DECIMAL(6, 2),
  "daily_steps_target" INT4,
  "is_active" BOOL NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "health_data_date_idx" ON "health_data" ("date" DESC);
