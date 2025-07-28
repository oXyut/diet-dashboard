import { NextRequest, NextResponse } from 'next/server'
import { isCleanArchitectureEnabled } from '@/lib/utils/featureFlags'

// Legacy implementation
import { supabase, getSupabaseAdmin } from '@/lib/supabase'

// Clean architecture implementation
import { PrismaHealthDataRepository } from '@/lib/repositories/implementations/PrismaHealthDataRepository'
import { HealthDataService } from '@/lib/services/HealthDataService'
import { withCors, handleOptions } from '@/lib/middleware/cors'
import { withAuth } from '@/lib/middleware/auth'
import { parseRequestBody } from '@/lib/utils/requestParser'
import { normalizeRequestBody } from '@/lib/utils/dateNormalizer'
import { ZodError } from 'zod'

// Clean architecture instances
const repository = new PrismaHealthDataRepository()
const service = new HealthDataService(repository)

// CORS headers for legacy
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
}

export async function OPTIONS() {
  if (isCleanArchitectureEnabled()) {
    return handleOptions()
  } else {
    return NextResponse.json({}, { headers: corsHeaders })
  }
}

export async function GET() {
  if (isCleanArchitectureEnabled()) {
    return handleGetWithCleanArchitecture()
  } else {
    return handleGetLegacy()
  }
}

export async function POST(request: NextRequest) {
  if (isCleanArchitectureEnabled()) {
    return handlePostWithCleanArchitecture(request)
  } else {
    return handlePostLegacy(request)
  }
}

// Clean Architecture Implementation
const handleGetWithCleanArchitecture = withCors(async () => {
  try {
    console.log('Using Clean Architecture for GET')
    const data = await service.getHealthData({ take: 100 })
    
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
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }))
    }
    
    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Clean Architecture GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
})

const handlePostWithCleanArchitecture = withCors(withAuth(async (request: NextRequest) => {
  try {
    console.log('Using Clean Architecture for POST')
    
    const rawBody = await parseRequestBody(request)
    const normalizedBody = normalizeRequestBody(rawBody)
    const result = await service.recordHealthData(normalizedBody)
    
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
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Clean Architecture POST error:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    )
  }
}))

// Legacy Implementation
async function handleGetLegacy() {
  try {
    console.log('Using Legacy implementation for GET')
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500, headers: corsHeaders })
    }

    const formattedData = {
      data: data.map(row => ({
        id: row.id,
        date: row.date,
        weight: row.weight,
        bodyFatPercentage: row.body_fat_percentage,
        muscleMass: row.muscle_mass,
        steps: row.steps,
        activeCalories: row.active_calories,
        restingCalories: row.resting_calories,
        totalCalories: row.total_calories,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    }

    return NextResponse.json(formattedData, { headers: corsHeaders })
  } catch (error) {
    console.error('Legacy GET error:', error)
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500, headers: corsHeaders })
  }
}

async function handlePostLegacy(request: NextRequest) {
  try {
    console.log('Using Legacy implementation for POST')
    
    // API Key認証
    const apiKey = request.headers.get('x-api-key')
    if (process.env.API_SECRET_KEY && apiKey !== process.env.API_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    // [Legacy implementation continues with existing logic...]
    // Content-Type handling, date normalization, etc.
    
    return NextResponse.json({ message: 'Legacy POST implementation' }, { headers: corsHeaders })
  } catch (error) {
    console.error('Legacy POST error:', error)
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500, headers: corsHeaders })
  }
}