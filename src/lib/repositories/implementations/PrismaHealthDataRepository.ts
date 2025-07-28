import { HealthData } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { IHealthDataRepository, FindManyOptions } from '../interfaces/IHealthDataRepository'
import { HealthDataInput } from '@/lib/validators/healthDataSchema'

export class PrismaHealthDataRepository implements IHealthDataRepository {
  async findByDate(date: Date): Promise<HealthData | null> {
    return prisma.healthData.findUnique({
      where: { date }
    })
  }

  async findMany(options: FindManyOptions = {}): Promise<HealthData[]> {
    const { take = 100, skip = 0, orderBy = { date: 'desc' } } = options
    
    return prisma.healthData.findMany({
      take,
      skip,
      orderBy
    })
  }

  async upsert(data: HealthDataInput & { totalCalories?: number | null }): Promise<HealthData> {
    const dateObj = new Date(data.date)
    
    return prisma.healthData.upsert({
      where: { date: dateObj },
      update: {
        weight: data.weight,
        bodyFatPercentage: data.bodyFatPercentage,
        muscleMass: data.muscleMass,
        steps: data.steps,
        activeCalories: data.activeCalories,
        restingCalories: data.restingCalories,
        totalCalories: data.totalCalories,
      },
      create: {
        date: dateObj,
        weight: data.weight,
        bodyFatPercentage: data.bodyFatPercentage,
        muscleMass: data.muscleMass,
        steps: data.steps,
        activeCalories: data.activeCalories,
        restingCalories: data.restingCalories,
        totalCalories: data.totalCalories,
      }
    })
  }

  async update(id: string, data: Partial<HealthDataInput>): Promise<HealthData> {
    return prisma.healthData.update({
      where: { id },
      data: {
        weight: data.weight,
        bodyFatPercentage: data.bodyFatPercentage,
        muscleMass: data.muscleMass,
        steps: data.steps,
        activeCalories: data.activeCalories,
        restingCalories: data.restingCalories,
      }
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.healthData.delete({
      where: { id }
    })
  }
}