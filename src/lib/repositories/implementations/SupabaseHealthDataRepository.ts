import { HealthData } from '@prisma/client'
import { supabase, getSupabaseAdmin } from '@/lib/supabase'
import { IHealthDataRepository, FindManyOptions } from '../interfaces/IHealthDataRepository'
import { HealthDataInput } from '@/lib/validators/healthDataSchema'

/**
 * Supabaseクライアントを使用したリポジトリ実装（Prismaのフォールバック）
 */
export class SupabaseHealthDataRepository implements IHealthDataRepository {
  async findByDate(date: Date): Promise<HealthData | null> {
    const dateString = date.toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('date', dateString)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Supabase error: ${error.message}`)
    }

    return this.mapSupabaseToHealthData(data)
  }

  async findMany(options: FindManyOptions = {}): Promise<HealthData[]> {
    const { take = 100, skip = 0, orderBy = { date: 'desc' } } = options
    
    let query = supabase
      .from('health_data')
      .select('*')
      .range(skip, skip + take - 1)

    // Order by
    if (orderBy.date) {
      query = query.order('date', { ascending: orderBy.date === 'asc' })
    } else if (orderBy.createdAt) {
      query = query.order('created_at', { ascending: orderBy.createdAt === 'asc' })
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    return data.map(row => this.mapSupabaseToHealthData(row))
  }

  async upsert(data: HealthDataInput & { totalCalories?: number | null }): Promise<HealthData> {
    const supabaseAdmin = getSupabaseAdmin()
    const dateObj = new Date(data.date)
    
    const processedData = {
      date: dateObj.toISOString().split('T')[0],
      weight: data.weight,
      body_fat_percentage: data.bodyFatPercentage,
      muscle_mass: data.muscleMass,
      steps: data.steps,
      active_calories: data.activeCalories,
      resting_calories: data.restingCalories,
      total_calories: data.totalCalories,
      // PFC栄養素
      protein_g: data.proteinG,
      fat_g: data.fatG,
      carbohydrate_g: data.carbohydrateG,
      // その他の栄養素
      fiber_g: data.fiberG,
      sugar_g: data.sugarG,
      sodium_mg: data.sodiumMg,
    }

    const { data: result, error } = await supabaseAdmin
      .from('health_data')
      .upsert(processedData, {
        onConflict: 'date'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    return this.mapSupabaseToHealthData(result)
  }

  async update(id: string, data: Partial<HealthDataInput>): Promise<HealthData> {
    const supabaseAdmin = getSupabaseAdmin()
    
    const processedData = {
      weight: data.weight,
      body_fat_percentage: data.bodyFatPercentage,
      muscle_mass: data.muscleMass,
      steps: data.steps,
      active_calories: data.activeCalories,
      resting_calories: data.restingCalories,
      // PFC栄養素
      protein_g: data.proteinG,
      fat_g: data.fatG,
      carbohydrate_g: data.carbohydrateG,
      // その他の栄養素
      fiber_g: data.fiberG,
      sugar_g: data.sugarG,
      sodium_mg: data.sodiumMg,
    }

    const { data: result, error } = await supabaseAdmin
      .from('health_data')
      .update(processedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    return this.mapSupabaseToHealthData(result)
  }

  async delete(id: string): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    
    const { error } = await supabaseAdmin
      .from('health_data')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }
  }

  private mapSupabaseToHealthData(row: any): HealthData {
    return {
      id: row.id,
      date: new Date(row.date),
      weight: row.weight,
      bodyFatPercentage: row.body_fat_percentage,
      muscleMass: row.muscle_mass,
      steps: row.steps,
      activeCalories: row.active_calories,
      restingCalories: row.resting_calories,
      totalCalories: row.total_calories,
      // PFC栄養素
      proteinG: row.protein_g,
      fatG: row.fat_g,
      carbohydrateG: row.carbohydrate_g,
      // その他の栄養素
      fiberG: row.fiber_g,
      sugarG: row.sugar_g,
      sodiumMg: row.sodium_mg,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }
}