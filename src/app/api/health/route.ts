import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { PrismaHealthDataRepository } from '@/lib/repositories/implementations/PrismaHealthDataRepository'
import { SupabaseHealthDataRepository } from '@/lib/repositories/implementations/SupabaseHealthDataRepository'
import { HealthDataService } from '@/lib/services/HealthDataService'
import { withCors, handleOptions } from '@/lib/middleware/cors'
import { withAuth } from '@/lib/middleware/auth'
import { parseRequestBody } from '@/lib/utils/requestParser'
import { normalizeRequestBody } from '@/lib/utils/dateNormalizer'

// インスタンス作成（依存性注入）
const repository = process.env.USE_PRISMA === 'true' 
  ? new PrismaHealthDataRepository()
  : new SupabaseHealthDataRepository()
const service = new HealthDataService(repository)

export async function OPTIONS() {
  return handleOptions()
}

export const GET = withCors(async () => {
  try {
    const data = await service.getHealthData({ take: 100 })
    
    // 既存のフロントエンドとの互換性のためのフォーマット変換
    const formattedData = {
      data: data.map(row => ({
        id: row.id,
        date: row.date.toISOString().split('T')[0],
        weight: row.weight ? Number(row.weight) : null,
        bodyFatPercentage: row.bodyFatPercentage ? Number(row.bodyFatPercentage) : null,
        muscleMass: row.muscleMass ? Number(row.muscleMass) : null,
        steps: row.steps,
        activeCalories: row.activeCalories,
        restingCalories: row.restingCalories,
        totalCalories: row.totalCalories,
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
      }))
    }
    
    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('GET /api/health error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
})

export const POST = withCors(withAuth(async (request: NextRequest) => {
  try {
    console.log('=== API Health POST Request (Clean Architecture) ===')
    console.log('Repository type:', process.env.USE_PRISMA === 'true' ? 'Prisma' : 'Supabase')
    
    // リクエストボディのパース
    const rawBody = await parseRequestBody(request)
    console.log('Raw body:', JSON.stringify(rawBody, null, 2))
    
    // ボディの正規化
    const normalizedBody = normalizeRequestBody(rawBody)
    console.log('Normalized body:', JSON.stringify(normalizedBody, null, 2))
    
    // サービス層でバリデーションとビジネスロジックを処理
    const result = await service.recordHealthData(normalizedBody)
    
    console.log('Data saved successfully')
    console.log('==============================\n')
    
    // レスポンスフォーマット（既存との互換性維持）
    const response = {
      id: result.id,
      date: result.date.toISOString().split('T')[0],
      weight: result.weight ? Number(result.weight) : null,
      bodyFatPercentage: result.bodyFatPercentage ? Number(result.bodyFatPercentage) : null,
      muscleMass: result.muscleMass ? Number(result.muscleMass) : null,
      steps: result.steps,
      activeCalories: result.activeCalories,
      restingCalories: result.restingCalories,
      totalCalories: result.totalCalories,
      // PFC栄養素
      proteinG: result.proteinG ? Number(result.proteinG) : null,
      fatG: result.fatG ? Number(result.fatG) : null,
      carbohydrateG: result.carbohydrateG ? Number(result.carbohydrateG) : null,
      // その他の栄養素
      fiberG: result.fiberG ? Number(result.fiberG) : null,
      sugarG: result.sugarG ? Number(result.sugarG) : null,
      sodiumMg: result.sodiumMg ? Number(result.sodiumMg) : null,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('=== API Health POST Error (Clean Architecture) ===')
    console.error('Error:', error)
    console.error('==============================\n')
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes('Invalid JSON')) {
      return NextResponse.json(
        {
          error: 'Invalid JSON format',
          details: error.message
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        error: 'Failed to save data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}))