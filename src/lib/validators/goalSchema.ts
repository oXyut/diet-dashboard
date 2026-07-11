import { z } from 'zod'

// goalsテーブルのカラムに対応する許可フィールドのみを定義
// （未知のフィールドはparse時に除去され、マスアサインメントを防ぐ）
export const goalSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  target_weight_kg: z.number().positive().nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  daily_calorie_intake_min: z.number().int().nonnegative().nullable().optional(),
  daily_calorie_intake_max: z.number().int().nonnegative().nullable().optional(),
  daily_protein_min_g: z.number().nonnegative().nullable().optional(),
  daily_protein_max_g: z.number().nonnegative().nullable().optional(),
  daily_fat_min_g: z.number().nonnegative().nullable().optional(),
  daily_fat_max_g: z.number().nonnegative().nullable().optional(),
  daily_carb_min_g: z.number().nonnegative().nullable().optional(),
  daily_carb_max_g: z.number().nonnegative().nullable().optional(),
  daily_steps_target: z.number().int().nonnegative().nullable().optional(),
  is_active: z.boolean().optional(),
})

export type GoalInput = z.infer<typeof goalSchema>
