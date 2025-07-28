// getYesterdayInJST関数をテスト
function getYesterdayInJST() {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffset);
  
  const yesterday = new Date(jstNow);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  
  const year = yesterday.getUTCFullYear();
  const month = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

console.log('Current time:', new Date().toISOString());
console.log('JST time:', new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
console.log('getYesterdayInJST():', getYesterdayInJST());

// データを確認
async function checkData() {
  try {
    const healthRes = await fetch('http://localhost:3000/api/health');
    const healthData = await healthRes.json();
    
    console.log('\nHealth data dates:');
    healthData.data.forEach((d, i) => {
      console.log(`  ${i}: ${d.date} - carb: ${d.carbohydrateG}g`);
    });
    
    const yesterdayStr = getYesterdayInJST();
    const yesterdayData = healthData.data.find(d => d.date === yesterdayStr);
    
    console.log(`\nLooking for date: ${yesterdayStr}`);
    if (yesterdayData) {
      console.log('Found data:', { date: yesterdayData.date, carb: yesterdayData.carbohydrateG });
    } else {
      console.log('No data found for yesterday, would use latest:', {
        date: healthData.data[0].date,
        carb: healthData.data[0].carbohydrateG
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();