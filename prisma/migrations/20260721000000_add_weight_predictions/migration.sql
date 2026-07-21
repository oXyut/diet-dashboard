CREATE TABLE IF NOT EXISTS "weight_predictions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "target_date" DATE NOT NULL,
  "source_date" DATE NOT NULL,
  "status" STRING NOT NULL DEFAULT 'ready',
  "prediction_kg" DECIMAL(5, 2),
  "interpretation_kg" DECIMAL(5, 2),
  "validation_mae_kg" DECIMAL(6, 4),
  "model_version" STRING(64),
  "mlflow_run_id" STRING(64),
  "top_contributions" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "weight_predictions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "weight_predictions_target_date_key" UNIQUE ("target_date")
);
