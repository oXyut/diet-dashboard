import { NextRequest, NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';

// CORS対応
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500, headers: corsHeaders });
    }

    // 既存のフォーマットに変換
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
    };

    return NextResponse.json(formattedData, { headers: corsHeaders });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    // API Key認証
    const apiKey = request.headers.get('x-api-key');
    if (process.env.API_SECRET_KEY && apiKey !== process.env.API_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Content-Typeチェック
    const contentType = request.headers.get('content-type');
    console.log('=== API Health POST Request ===');
    console.log('Content-Type:', contentType);
    
    let body;
    
    // Content-Typeに応じて処理を分岐
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else {
      // プレーンテキストとして受け取ってJSONパース
      const text = await request.text();
      console.log('Raw text body:', text);
      try {
        body = JSON.parse(text);
      } catch (e) {
        console.error('JSON parse error:', e);
        return NextResponse.json(
          { error: 'Invalid JSON', received: text }, 
          { status: 400, headers: corsHeaders }
        );
      }
    }
    
    console.log('Parsed body:', JSON.stringify(body, null, 2));
    
    // キー名の正規化（スペースのトリム）
    const normalizedBody: any = {};
    for (const [key, value] of Object.entries(body)) {
      normalizedBody[key.trim()] = value;
    }
    
    const { date, weight, bodyFatPercentage, muscleMass, steps, activeCalories, restingCalories } = normalizedBody;
    
    // 日付の正規化
    let normalizedDate;
    if (date) {
      // いくつかの日付形式に対応
      if (date.includes('/')) {
        // "2025/07/26 13:23" -> "2025-07-26"
        const datePart = date.split(' ')[0].replace(/\//g, '-');
        normalizedDate = datePart;
      } else if (date.includes('-')) {
        // "2025-07-26" or "2025-07-26T..." -> "2025-07-26"
        normalizedDate = date.split('T')[0];
      } else {
        normalizedDate = date;
      }
    } else {
      normalizedDate = new Date().toISOString().split('T')[0];
    }
    
    // データ型の変換とバリデーション
    const processedData = {
      date: normalizedDate,
      weight: weight !== undefined ? Number(weight) : null,
      body_fat_percentage: bodyFatPercentage !== undefined ? Number(bodyFatPercentage) : null,
      muscle_mass: muscleMass !== undefined ? Number(muscleMass) : null,
      steps: steps !== undefined ? Number(steps) : null,
      active_calories: activeCalories !== undefined ? Number(activeCalories) : null,
      resting_calories: restingCalories !== undefined ? Number(restingCalories) : null,
    };
    
    // totalCaloriesの計算
    let totalCalories = null;
    if (processedData.active_calories !== null && processedData.resting_calories !== null) {
      totalCalories = processedData.active_calories + processedData.resting_calories;
    } else if (processedData.active_calories !== null) {
      totalCalories = processedData.active_calories;
    } else if (processedData.resting_calories !== null) {
      totalCalories = processedData.resting_calories;
    }
    
    const supabaseAdmin = getSupabaseAdmin();
    
    // Upsert (存在する場合は更新、なければ挿入)
    const { data, error } = await supabaseAdmin
      .from('health_data')
      .upsert({
        ...processedData,
        total_calories: totalCalories,
      }, {
        onConflict: 'date'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save data' }, { status: 500, headers: corsHeaders });
    }

    console.log('Data saved successfully');
    console.log('==============================\n');
    
    // レスポンスを既存のフォーマットに合わせる
    const response = {
      id: data.id,
      date: data.date,
      weight: data.weight,
      bodyFatPercentage: data.body_fat_percentage,
      muscleMass: data.muscle_mass,
      steps: data.steps,
      activeCalories: data.active_calories,
      restingCalories: data.resting_calories,
      totalCalories: data.total_calories,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    
    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error: any) {
    console.error('=== API Health POST Error ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('==============================\n');
    return NextResponse.json(
      { error: 'Failed to save data', details: error.message }, 
      { status: 500, headers: corsHeaders }
    );
  }
}