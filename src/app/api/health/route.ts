import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'health-data.json');

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify({ data: [] }));
  }
}

// CORS対応
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    await ensureDataFile();
    const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
    let data;
    try {
      data = JSON.parse(fileContent || '{"data":[]}');
    } catch (e) {
      console.log('Initializing empty data file');
      data = { data: [] };
    }
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Content-Typeチェック
    const contentType = request.headers.get('content-type');
    console.log('=== API Health POST Request ===');
    console.log('Content-Type:', contentType);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
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
    
    await ensureDataFile();
    
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
    // undefinedの場合はnull、値がある場合は数値に変換（0も有効な値として扱う）
    const processedData = {
      date: normalizedDate,
      weight: weight !== undefined ? Number(weight) : null,
      bodyFatPercentage: bodyFatPercentage !== undefined ? Number(bodyFatPercentage) : null,
      muscleMass: muscleMass !== undefined ? Number(muscleMass) : null,
      steps: steps !== undefined ? Number(steps) : null,
      activeCalories: activeCalories !== undefined ? Number(activeCalories) : null,
      restingCalories: restingCalories !== undefined ? Number(restingCalories) : null,
    };
    
    console.log('Processed data:', JSON.stringify(processedData, null, 2));
    
    const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
    let data;
    try {
      data = JSON.parse(fileContent || '{"data":[]}');
    } catch (e) {
      console.log('Initializing empty data file');
      data = { data: [] };
    }
    
    const existingIndex = data.data.findIndex((item: any) => item.date === processedData.date);
    
    // totalCaloriesの計算: 両方の値が存在する場合のみ計算
    let totalCalories = null;
    if (processedData.activeCalories !== null && processedData.restingCalories !== null) {
      totalCalories = processedData.activeCalories + processedData.restingCalories;
    } else if (processedData.activeCalories !== null) {
      // アクティブカロリーのみの場合（安静時カロリーが不明）
      totalCalories = processedData.activeCalories;
    } else if (processedData.restingCalories !== null) {
      // 安静時カロリーのみの場合（アクティブカロリーが不明）
      totalCalories = processedData.restingCalories;
    }
    
    const newEntry = {
      id: existingIndex >= 0 ? data.data[existingIndex].id : Date.now().toString(),
      ...processedData,
      totalCalories,
      createdAt: existingIndex >= 0 ? data.data[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      data.data[existingIndex] = newEntry;
      console.log('Updated existing entry for date:', processedData.date);
    } else {
      data.data.push(newEntry);
      console.log('Added new entry for date:', processedData.date);
    }
    
    data.data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Data saved successfully');
    console.log('==============================\n');
    
    return NextResponse.json(newEntry, { headers: corsHeaders });
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