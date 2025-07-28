import { z } from 'zod'

export const healthDataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  weight: z.number().positive().nullable().optional(),
  bodyFatPercentage: z.number().min(0).max(100).nullable().optional(),
  muscleMass: z.number().positive().nullable().optional(),
  steps: z.number().int().nonnegative().nullable().optional(),
  activeCalories: z.number().int().nonnegative().nullable().optional(),
  restingCalories: z.number().int().nonnegative().nullable().optional(),
})

export type HealthDataInput = z.infer<typeof healthDataSchema>

export const validateHealthData = (data: unknown): HealthDataInput => {
  return healthDataSchema.parse(data)
}