import { NextRequest } from 'next/server'

/**
 * リクエストボディをパースする（Content-Typeに応じて）
 */
export async function parseRequestBody(request: NextRequest): Promise<any> {
  const contentType = request.headers.get('content-type')
  
  console.log('=== Request Parser ===')
  console.log('Content-Type:', contentType)
  
  if (contentType?.includes('application/json')) {
    return request.json()
  } else {
    // プレーンテキストとして受け取ってJSONパース
    const text = await request.text()
    console.log('Raw text body:', text)
    
    try {
      return JSON.parse(text)
    } catch (error) {
      console.error('JSON parse error:', error)
      throw new Error(`Invalid JSON: ${text}`)
    }
  }
}