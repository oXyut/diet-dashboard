// getYesterdayInJST関数を直接定義
function getYesterdayInJST() {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstTime = new Date(now.getTime() + jstOffset);
  jstTime.setUTCDate(jstTime.getUTCDate() - 1);
  const year = jstTime.getUTCFullYear();
  const month = String(jstTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 現在の日時を確認
console.log('=== Debug Achievement Status ===');
console.log('Current time (UTC):', new Date().toISOString());
console.log('Current time (JST):', new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
console.log('Yesterday (JST):', getYesterdayInJST());

// APIからデータを取得
async function debugData() {
  try {
    // Health data
    const healthRes = await fetch('http://localhost:3000/api/health');
    const healthData = await healthRes.json();
    
    // Goals data
    const goalsRes = await fetch('http://localhost:3000/api/goals?active=true');
    const goalsData = await goalsRes.json();
    
    const latestHealth = healthData.data[0];
    const goal = goalsData.data[0];
    
    console.log('\n=== Latest Health Data ===');
    console.log('Date:', latestHealth.date);
    console.log('Carbohydrate:', latestHealth.carbohydrateG, 'g');
    console.log('Protein:', latestHealth.proteinG, 'g');
    console.log('Fat:', latestHealth.fatG, 'g');
    
    console.log('\n=== Goal Data ===');
    console.log('Carb range:', goal.daily_carb_min_g, '-', goal.daily_carb_max_g, 'g');
    console.log('Protein range:', goal.daily_protein_min_g, '-', goal.daily_protein_max_g, 'g');
    console.log('Fat range:', goal.daily_fat_min_g, '-', goal.daily_fat_max_g, 'g');
    
    console.log('\n=== Achievement Analysis ===');
    // 炭水化物
    if (latestHealth.carbohydrateG < goal.daily_carb_min_g) {
      console.log('Carbohydrate: UNDER (不足)');
    } else if (latestHealth.carbohydrateG > goal.daily_carb_max_g) {
      console.log('Carbohydrate: OVER (超過) ← Should be this!');
    } else {
      console.log('Carbohydrate: WITHIN (目標範囲内)');
    }
    
    // 実際の判定
    console.log('\nActual values:');
    console.log(`Carb ${latestHealth.carbohydrateG} vs min ${goal.daily_carb_min_g}: ${latestHealth.carbohydrateG < goal.daily_carb_min_g ? 'UNDER' : 'OK'}`);
    console.log(`Carb ${latestHealth.carbohydrateG} vs max ${goal.daily_carb_max_g}: ${latestHealth.carbohydrateG > goal.daily_carb_max_g ? 'OVER' : 'OK'}`);
    
    // 7月27日のデータも確認
    const previousHealth = healthData.data[1];
    console.log('\n=== Previous Day (7/27) Data ===');
    console.log('Date:', previousHealth.date);
    console.log('Carbohydrate:', previousHealth.carbohydrateG, 'g');
    if (previousHealth.carbohydrateG < goal.daily_carb_min_g) {
      console.log('Status: UNDER (不足) ← If showing this, wrong data is being used!');
    } else if (previousHealth.carbohydrateG > goal.daily_carb_max_g) {
      console.log('Status: OVER (超過)');
    } else {
      console.log('Status: WITHIN (目標範囲内)');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugData();