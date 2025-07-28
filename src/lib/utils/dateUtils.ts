/**
 * 日本時間で昨日の日付を取得する
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function getYesterdayInJST(): string {
  // 現在の日本時間を取得
  const now = new Date();
  // UTCからJSTへのオフセット（+9時間）を適用
  const jstOffset = 9 * 60 * 60 * 1000; // 9時間をミリ秒に変換
  const jstTime = new Date(now.getTime() + jstOffset);
  
  // 昨日の日付を計算
  jstTime.setUTCDate(jstTime.getUTCDate() - 1);
  
  // YYYY-MM-DD形式に変換
  const year = jstTime.getUTCFullYear();
  const month = String(jstTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 日本時間で今日の日付を取得する
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function getTodayInJST(): string {
  // 現在の日本時間を取得
  const now = new Date();
  // UTCからJSTへのオフセット（+9時間）を適用
  const jstOffset = 9 * 60 * 60 * 1000; // 9時間をミリ秒に変換
  const jstTime = new Date(now.getTime() + jstOffset);
  
  // YYYY-MM-DD形式に変換
  const year = jstTime.getUTCFullYear();
  const month = String(jstTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}