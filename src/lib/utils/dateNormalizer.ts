/**
 * iPhoneショートカットから送信される様々な日付形式を正規化する
 */
export function normalizeDateString(dateInput: string): string {
  if (!dateInput) {
    return new Date().toISOString().split('T')[0]
  }

  // "2025/07/26 13:23" -> "2025-07-26"
  if (dateInput.includes('/')) {
    const datePart = dateInput.split(' ')[0].replace(/\//g, '-')
    return datePart
  }
  
  // "2025-07-26T..." -> "2025-07-26"
  if (dateInput.includes('T')) {
    return dateInput.split('T')[0]
  }
  
  // Already in correct format "2025-07-26"
  return dateInput
}

/**
 * リクエストボディの日付フィールドを正規化する
 */
export function normalizeRequestBody(body: any): any {
  // キー名の正規化（スペースのトリム）
  const normalizedBody: any = {}
  for (const [key, value] of Object.entries(body)) {
    normalizedBody[key.trim()] = value
  }
  
  // 日付の正規化
  if (normalizedBody.date) {
    normalizedBody.date = normalizeDateString(normalizedBody.date)
  }
  
  return normalizedBody
}