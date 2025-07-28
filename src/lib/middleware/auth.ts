import { NextRequest, NextResponse } from 'next/server'

export function withAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // API Key認証
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.API_SECRET_KEY
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return handler(request)
  }
}