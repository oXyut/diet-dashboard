import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
}

export function withCors<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const response = await handler(...args)
      
      // Add CORS headers to the response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    } catch (error) {
      // Ensure CORS headers are added to error responses too
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500, headers: corsHeaders }
      )
      return errorResponse
    }
  }
}

export function handleOptions(): NextResponse {
  return NextResponse.json({}, { headers: corsHeaders })
}