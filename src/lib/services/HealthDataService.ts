import { HealthData } from '@prisma/client'
import { IHealthDataRepository, FindManyOptions } from '@/lib/repositories/interfaces/IHealthDataRepository'
import { HealthDataInput, validateHealthData } from '@/lib/validators/healthDataSchema'

export class HealthDataService {
  constructor(private repository: IHealthDataRepository) {}

  async getHealthData(options?: FindManyOptions): Promise<HealthData[]> {
    return this.repository.findMany(options)
  }

  async getHealthDataByDate(date: string): Promise<HealthData | null> {
    const dateObj = new Date(date)
    return this.repository.findByDate(dateObj)
  }

  async recordHealthData(input: unknown): Promise<HealthData> {
    // バリデーション
    const validatedData = validateHealthData(input)
    
    // ビジネスロジック: totalCalories の計算
    const totalCalories = this.calculateTotalCalories(validatedData)
    
    // 永続化
    return this.repository.upsert({
      ...validatedData,
      totalCalories
    })
  }

  async updateHealthData(id: string, input: Partial<HealthDataInput>): Promise<HealthData> {
    // 部分的なバリデーション（必要に応じて）
    return this.repository.update(id, input)
  }

  async deleteHealthData(id: string): Promise<void> {
    return this.repository.delete(id)
  }

  private calculateTotalCalories(data: HealthDataInput): number | null {
    const { activeCalories, restingCalories } = data
    
    if (activeCalories !== null && activeCalories !== undefined && 
        restingCalories !== null && restingCalories !== undefined) {
      return activeCalories + restingCalories
    }
    
    if (activeCalories !== null && activeCalories !== undefined) {
      return activeCalories
    }
    
    if (restingCalories !== null && restingCalories !== undefined) {
      return restingCalories
    }
    
    return null
  }
}