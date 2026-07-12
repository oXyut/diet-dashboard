const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: process.env.ENV_FILE || path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const baseUrl = process.env.MOBILE_API_BASE_URL;
const apiKey = process.env.API_SECRET_KEY;

if (!baseUrl || !apiKey) {
  console.error(
    'MOBILE_API_BASE_URL と API_SECRET_KEY を .env.local または環境変数に設定してください。'
  );
  process.exit(1);
}

const ttlMinutes = Number(process.env.PAIRING_CODE_TTL_MINUTES || 10);

fetch(`${baseUrl.replace(/\/$/, '')}/api/admin/mobile-pairing-codes`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  },
  body: JSON.stringify({ ttlMinutes }),
})
  .then(async (response) => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || `HTTP ${response.status}`);
    }

    console.log(`ペアリングコード: ${body.code}`);
    console.log(`有効期限: ${body.expiresAt}`);
    console.log('iPhone アプリの初回設定画面でこのコードを入力してください。');
  })
  .catch((error) => {
    console.error(`ペアリングコードの発行に失敗しました: ${error.message}`);
    process.exitCode = 1;
  });
