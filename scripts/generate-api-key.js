// API Secret Key生成スクリプト
const crypto = require('crypto');

// ランダムな32文字の文字列を生成
const apiKey = crypto.randomBytes(32).toString('base64url');

console.log('Generated API Secret Key:');
console.log(apiKey);
console.log('\nこのキーを以下の場所に設定してください:');
console.log('1. .env.local の API_SECRET_KEY');
console.log('2. Vercel の環境変数 API_SECRET_KEY');
console.log('3. iPhoneショートカットの X-API-Key ヘッダー');