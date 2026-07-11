import { NextRequest } from 'next/server'

/**
 * リクエストボディをパースする（Content-Typeに応じて）
 */
export async function parseRequestBody(request: NextRequest): Promise<unknown> {
  const contentType = request.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    return request.json()
  } else {
    // プレーンテキストとして受け取ってJSONパース
    const text = await request.text()

    try {
      return JSON.parse(text)
    } catch (error) {
      console.error('JSON parse error:', error)
      // ボディの内容（個人データを含む可能性がある）はエラーメッセージに含めない
      throw new Error('Invalid JSON in request body')
    }
  }
}