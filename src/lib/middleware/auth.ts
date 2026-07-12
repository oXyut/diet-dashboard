import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashDeviceToken } from '@/lib/mobileCredentials';

// タイミング攻撃を防ぐための定数時間比較
// 長さが異なる場合も早期returnせず、必ずtimingSafeEqualを実行する
function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    // 比較時間を揃えるため、同じ長さのバッファ同士で比較してからfalseを返す
    timingSafeEqual(aBuffer, aBuffer);
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

function hasValidApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedApiKey = process.env.API_SECRET_KEY;

  if (!expectedApiKey) {
    console.error('API_SECRET_KEY is not configured');
    return false;
  }

  return Boolean(apiKey && safeCompare(apiKey, expectedApiKey));
}

async function hasValidMobileToken(request: NextRequest): Promise<boolean> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return false;
  }

  const tokenHash = hashDeviceToken(token);
  if (!tokenHash) {
    console.error('MOBILE_TOKEN_PEPPER is not configured');
    return false;
  }

  const device = await prisma.mobileDevice.findUnique({
    where: { tokenHash },
    select: { id: true, revokedAt: true },
  });

  if (!device || device.revokedAt) {
    return false;
  }

  await prisma.mobileDevice.update({
    where: { id: device.id },
    data: { lastUsedAt: new Date() },
  });

  return true;
}

export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    if (!process.env.API_SECRET_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!hasValidApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(request, ...args);
  };
}

// 健康データの書き込みだけは、既存の管理 API キーに加えて端末専用トークンを許可する。
export function withHealthWriteAuth<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    if (process.env.API_SECRET_KEY && hasValidApiKey(request)) {
      return handler(request, ...args);
    }

    if (await hasValidMobileToken(request)) {
      return handler(request, ...args);
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  };
}
