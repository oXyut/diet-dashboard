import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock('@/lib/prisma', () => ({ prisma: { healthData: { findMany: mocks.findMany } } }));

import { GET } from './route';

describe('GET /api/ml/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_SECRET_KEY = 'test-key';
  });

  it('開始日・終了日を指定して昇順でページングする', async () => {
    mocks.findMany.mockResolvedValue([
      { id: '1', date: new Date('2026-07-01'), createdAt: new Date(), updatedAt: new Date() },
      { id: '2', date: new Date('2026-07-02'), createdAt: new Date(), updatedAt: new Date() },
      { id: '3', date: new Date('2026-07-03'), createdAt: new Date(), updatedAt: new Date() },
    ]);

    const response = await GET(
      new NextRequest('http://localhost/api/ml/health?start=2026-07-01&end=2026-07-31&limit=2', {
        headers: { 'x-api-key': 'test-key' },
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      nextCursor: '2026-07-02',
      data: [{ id: '1' }, { id: '2' }],
    });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { date: 'asc' }, take: 3 })
    );
  });

  it('APIキーがない取得を拒否する', async () => {
    const response = await GET(new NextRequest('http://localhost/api/ml/health'));
    expect(response.status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
