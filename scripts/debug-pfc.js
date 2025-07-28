const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://juzphkvisimefyoqehox.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1enBoa3Zpc2ltZWZ5b3FlaG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzUwMjAxMiwiZXhwIjoyMDY5MDc4MDEyfQ.sL4B8EYQiTYNZnGfbsMTlLLqEHkp7V1_nR4duQF8jfY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugPFCData() {
  console.log('=== Debugging PFC Data ===')
  
  // 1. テーブル構造を確認
  console.log('\n1. Getting table structure...')
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'health_data')
    .eq('table_schema', 'public')
  
  if (columnsError) {
    console.error('Error getting table structure:', columnsError)
  } else {
    console.log('Table columns:', columns)
  }
  
  // 2. 最新のデータを取得
  console.log('\n2. Getting latest data...')
  const { data: latestData, error: latestError } = await supabase
    .from('health_data')
    .select('*')
    .order('date', { ascending: false })
    .limit(3)
  
  if (latestError) {
    console.error('Error getting latest data:', latestError)
  } else {
    console.log('Latest data:', JSON.stringify(latestData, null, 2))
  }
  
  // 3. 特定の日付のデータをチェック（2025-07-28）
  console.log('\n3. Getting data for 2025-07-28...')
  const { data: todayData, error: todayError } = await supabase
    .from('health_data')
    .select('*')
    .eq('date', '2025-07-28')
  
  if (todayError) {
    console.error('Error getting today data:', todayError)
  } else {
    console.log('Today data:', JSON.stringify(todayData, null, 2))
  }
  
  // 4. テストデータを挿入/更新
  console.log('\n4. Testing upsert with PFC data...')
  const testData = {
    date: '2025-07-28',
    weight: 111.8,
    body_fat_percentage: 33.4,
    protein_g: 116.6,
    steps: 7545,
    carbohydrate_g: 277.8,
    fat_g: 29.3
  }
  
  const { data: upsertData, error: upsertError } = await supabase
    .from('health_data')
    .upsert(testData, { onConflict: 'date' })
    .select()
  
  if (upsertError) {
    console.error('Error upserting test data:', upsertError)
  } else {
    console.log('Upsert successful:', JSON.stringify(upsertData, null, 2))
  }
  
  // 5. 更新後のデータを再取得
  console.log('\n5. Getting updated data...')
  const { data: updatedData, error: updatedError } = await supabase
    .from('health_data')
    .select('*')
    .eq('date', '2025-07-28')
  
  if (updatedError) {
    console.error('Error getting updated data:', updatedError)
  } else {
    console.log('Updated data:', JSON.stringify(updatedData, null, 2))
  }
}

debugPFCData().catch(console.error)