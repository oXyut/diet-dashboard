import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PrismaHealthDataRepository } from '@/lib/repositories/implementations/PrismaHealthDataRepository';
import { HealthDataService } from '@/lib/services/HealthDataService';
import { withHealthReadAuth, withHealthWriteAuth } from '@/lib/middleware/auth';
import { formatHealthData } from '@/lib/formatters';
import { parseRequestBody } from '@/lib/utils/requestParser';
import { normalizeRequestBody } from '@/lib/utils/dateNormalizer';

// CockroachDB へのアクセスは Prisma に統一する。
const repository = new PrismaHealthDataRepository();
const service = new HealthDataService(repository);

// ペアリング済みiPhoneは、POST後にGETでサーバー保存済みの更新日時を確認する。
// ダッシュボードはこのAPIを経由せず、サーバーコンポーネントでサービス層を直接呼ぶ。
export const GET = withHealthReadAuth(async () => {
  try {
    const data = await service.getHealthData({ take: 100 });

    return NextResponse.json({ data: data.map(formatHealthData) });
  } catch (error) {
    console.error('GET /api/health error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
});

export const POST = withHealthWriteAuth(async (request: NextRequest) => {
  try {
    // リクエストボディのパース
    const rawBody = await parseRequestBody(request);

    // ボディの正規化
    const normalizedBody = normalizeRequestBody(rawBody);

    // サービス層でバリデーションとビジネスロジックを処理
    const result = await service.recordHealthData(normalizedBody);

    return NextResponse.json(formatHealthData(result));
  } catch (error) {
    console.error('POST /api/health error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Invalid JSON')) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
});
