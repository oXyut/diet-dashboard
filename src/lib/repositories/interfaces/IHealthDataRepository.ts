import { HealthData } from '@prisma/client'
import { HealthDataInput } from '@/lib/validators/healthDataSchema'

export interface FindManyOptions {
  take?: number
  skip?: number
  orderBy?: {
    date?: 'asc' | 'desc'
    createdAt?: 'asc' | 'desc'
  }
}

export interface IHealthDataRepository {
  findByDate(date: Date): Promise<HealthData | null>
  findMany(options?: FindManyOptions): Promise<HealthData[]>
  upsert(data: HealthDataInput & { totalCalories?: number | null }): Promise<HealthData>
  update(id: string, data: Partial<HealthDataInput>): Promise<HealthData>
  delete(id: string): Promise<void>
}