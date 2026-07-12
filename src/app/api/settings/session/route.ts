import { NextRequest, NextResponse } from 'next/server';
import {
  createDashboardSession,
  dashboardSessionMaxAge,
  DASHBOARD_SESSION_COOKIE,
  isDashboardPasswordValid,
} from '@/lib/dashboardAuth';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (typeof password !== 'string' || !isDashboardPasswordValid(password)) {
    return NextResponse.json({ error: 'パスワードが正しくありません' }, { status: 401 });
  }
  const token = createDashboardSession();
  if (!token) return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(DASHBOARD_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: dashboardSessionMaxAge,
    path: '/',
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(DASHBOARD_SESSION_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' });
  return response;
}
