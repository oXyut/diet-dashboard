/**
 * 日本時間で昨日の日付を取得する
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function getYesterdayInJST(): string {
  // 現在の日本時間を取得（より正確な方法）
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000; // 9時間のオフセット
  const jstNow = new Date(now.getTime() + jstOffset);
  
  // 「昨日の状況」として表示するべき日付を取得
  // 23:50にデータが送信されるため、その日のデータは翌日に「昨日の状況」として表示される
  const yesterday = new Date(jstNow);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  
  // YYYY-MM-DD形式に変換
  const year = yesterday.getUTCFullYear();
  const month = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getUTCDate()).padStart(2, '0');
  
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