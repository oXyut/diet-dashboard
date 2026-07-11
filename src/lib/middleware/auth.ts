import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

// タイミング攻撃を防ぐための定数時間比較
// 長さが異なる場合も早期returnせず、必ずtimingSafeEqualを実行する
function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)

  if (aBuffer.length !== bBuffer.length) {
    // 比較時間を揃えるため、同じ長さのバッファ同士で比較してからfalseを返す
    timingSafeEqual(aBuffer, aBuffer)
    return false
  }

  return timingSafeEqual(aBuffer, bBuffer)
}

export function withAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // API Key認証
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.API_SECRET_KEY

    // API_SECRET_KEY未設定時はフェイルクローズ（認証をスキップしない）
    if (!expectedApiKey) {
      console.error('API_SECRET_KEY is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!apiKey || !safeCompare(apiKey, expectedApiKey)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(request)
  }
}
