import {
  HealthData as PrismaHealthData,
  Goal as PrismaGoal,
  WeightPrediction as PrismaWeightPrediction,
} from '@prisma/client';
import { HealthData, Goal, WeightPrediction, WeightPredictionContribution } from '@/types/health';

// Prismaの行をフロントエンド/APIレスポンス共通のJSON形式へ変換する
export function formatHealthData(row: PrismaHealthData): HealthData {
  return {
    id: row.id,
    date: row.date.toISOString().split('T')[0],
    weight: row.weight ? Number(row.weight) : null,
    bodyFatPercentage: row.bodyFatPercentage ? Number(row.bodyFatPercentage) : null,
    muscleMass: row.muscleMass ? Number(row.muscleMass) : null,
    steps: row.steps,
    activeCalories: row.activeCalories,
    restingCalories: row.restingCalories,
    totalCalories: row.totalCalories,
    dietaryCalories: row.dietaryCalories,
    // PFC栄養素
    proteinG: row.proteinG ? Number(row.proteinG) : null,
    fatG: row.fatG ? Number(row.fatG) : null,
    carbohydrateG: row.carbohydrateG ? Number(row.carbohydrateG) : null,
    // その他の栄養素
    fiberG: row.fiberG ? Number(row.fiberG) : null,
    sugarG: row.sugarG ? Number(row.sugarG) : null,
    sodiumMg: row.sodiumMg ? Number(row.sodiumMg) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function formatGoal(goal: PrismaGoal): Goal {
  return {
    id: goal.id,
    name: goal.name,
    description: goal.description,
    target_weight_kg: goal.targetWeightKg ? Number(goal.targetWeightKg) : null,
    starting_weight_kg: goal.startingWeightKg != null ? Number(goal.startingWeightKg) : null,
    protein_target_percent:
      goal.proteinTargetPercent != null ? Number(goal.proteinTargetPercent) : null,
    fat_target_percent: goal.fatTargetPercent != null ? Number(goal.fatTargetPercent) : null,
    carbohydrate_target_percent:
      goal.carbohydrateTargetPercent != null ? Number(goal.carbohydrateTargetPercent) : null,
    start_date: goal.startDate.toISOString().slice(0, 10),
    end_date: goal.endDate.toISOString().slice(0, 10),
    daily_calorie_intake_min: goal.dailyCalorieIntakeMin,
    daily_calorie_intake_max: goal.dailyCalorieIntakeMax,
    daily_protein_min_g: goal.dailyProteinMinG ? Number(goal.dailyProteinMinG) : null,
    daily_protein_max_g: goal.dailyProteinMaxG ? Number(goal.dailyProteinMaxG) : null,
    daily_fat_min_g: goal.dailyFatMinG ? Number(goal.dailyFatMinG) : null,
    daily_fat_max_g: goal.dailyFatMaxG ? Number(goal.dailyFatMaxG) : null,
    daily_carb_min_g: goal.dailyCarbMinG ? Number(goal.dailyCarbMinG) : null,
    daily_carb_max_g: goal.dailyCarbMaxG ? Number(goal.dailyCarbMaxG) : null,
    daily_steps_target: goal.dailyStepsTarget,
    is_active: goal.isActive,
    created_at: goal.createdAt.toISOString(),
    updated_at: goal.updatedAt.toISOString(),
  };
}

export function formatWeightPrediction(row: PrismaWeightPrediction): WeightPrediction {
  const contributions: WeightPredictionContribution[] = Array.isArray(row.topContributions)
    ? row.topContributions.flatMap((item) => {
        if (
          typeof item !== 'object' ||
          item === null ||
          typeof (item as { feature?: unknown }).feature !== 'string' ||
          typeof (item as { contribution_kg?: unknown }).contribution_kg !== 'number'
        ) {
          return [];
        }
        return [
          {
            feature: (item as { feature: string }).feature,
            contribution_kg: (item as { contribution_kg: number }).contribution_kg,
          },
        ];
      })
    : [];

  return {
    id: row.id,
    targetDate: row.targetDate.toISOString().slice(0, 10),
    sourceDate: row.sourceDate.toISOString().slice(0, 10),
    status: row.status as WeightPrediction['status'],
    predictionKg: row.predictionKg == null ? null : Number(row.predictionKg),
    interpretationKg: row.interpretationKg == null ? null : Number(row.interpretationKg),
    validationMaeKg: row.validationMaeKg == null ? null : Number(row.validationMaeKg),
    modelVersion: row.modelVersion,
    mlflowRunId: row.mlflowRunId,
    topContributions: contributions,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
