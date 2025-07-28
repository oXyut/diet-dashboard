#!/usr/bin/env node

/**
 * Clean Architecture API テスト用スクリプト
 */

const testData = {
  date: "2025-07-28",
  weight: 70.5,
  bodyFatPercentage: 15.2,
  muscleMass: 52.8,
  steps: 8500,
  activeCalories: 450,
  restingCalories: 1800
};

const API_URL = 'http://localhost:3000/api/health';
const API_KEY = 'kdVPgiw5YHA3i6MEoH5tXFmGXAxPuzkOBjbZAqzpk1E';

async function testAPI() {
  console.log('🧪 Clean Architecture API Test');
  console.log('================================\n');

  // Test GET endpoint
  console.log('1. Testing GET /api/health...');
  try {
    const getResponse = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const getData = await getResponse.json();
    console.log('✅ GET Success:', getResponse.status);
    console.log('📊 Data Count:', getData.data?.length || 0);
    console.log('📝 Sample:', getData.data?.[0] || 'No data');
  } catch (error) {
    console.log('❌ GET Failed:', error.message);
  }

  console.log('\n' + '-'.repeat(50) + '\n');

  // Test POST endpoint
  console.log('2. Testing POST /api/health...');
  try {
    const postResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(testData)
    });
    
    const postData = await postResponse.json();
    console.log('✅ POST Success:', postResponse.status);
    console.log('📝 Response:', JSON.stringify(postData, null, 2));
  } catch (error) {
    console.log('❌ POST Failed:', error.message);
  }

  console.log('\n' + '-'.repeat(50) + '\n');

  // Test GET again to see if data was saved
  console.log('3. Testing GET again after POST...');
  try {
    const getResponse2 = await fetch(API_URL);
    const getData2 = await getResponse2.json();
    console.log('✅ GET Success:', getResponse2.status);
    console.log('📊 Updated Data Count:', getData2.data?.length || 0);
    console.log('📝 Latest Entry:', getData2.data?.[0] || 'No data');
  } catch (error) {
    console.log('❌ GET Failed:', error.message);
  }

  console.log('\n================================');
  console.log('🏁 Test Complete!');
}

// iPhone風のリクエストテスト
async function testIPhoneRequest() {
  console.log('\n📱 iPhone-style Request Test');
  console.log('==============================\n');

  const iPhoneData = {
    " date": "2025/07/28 14:30",  // Leading space and different format
    "weight": "71.2",
    "bodyFatPercentage": "14.8",
    "steps": "9200"
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain', // iPhone might send as plain text
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(iPhoneData)
    });
    
    const data = await response.json();
    console.log('✅ iPhone-style POST Success:', response.status);
    console.log('📝 Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ iPhone-style POST Failed:', error.message);
  }
}

async function main() {
  try {
    await testAPI();
    await testIPhoneRequest();
  } catch (error) {
    console.error('💥 Test script error:', error.message);
  }
}

if (require.main === module) {
  main();
}