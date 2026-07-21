import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ upsert: vi.fn() }));

vi.mock('@/lib/prisma', () => ({ prisma: { weightPrediction: { upsert: mocks.upsert } } }));

import { POST } from './route';

const payload = {
  targetDate: '2026-07-22',
  sourceDate: '2026-07-21',
  status: 'ready',
  predictionKg: 70.2,
  interpretationKg: 70.1,
  validationMaeKg: 0.12,
  modelVersion: '4',
  mlflowRunId: 'run-id',
  topContributions: [{ feature: 'weight', contribution_kg: 0.02 }],
};

describe('POST /api/ml/predictions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_SECRET_KEY = 'test-key';
    mocks.upsert.mockImplementation(async ({ create }) => ({
      id: 'prediction-id',
      ...create,
      createdAt: new Date('2026-07-21T00:00:00.000Z'),
      updatedAt: new Date('2026-07-21T00:00:00.000Z'),
    }));
  });

  it('対象日ごとに予測をupsertする', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/ml/predictions', {
        method: 'POST',
        headers: { 'x-api-key': 'test-key' },
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ targetDate: '2026-07-22', predictionKg: 70.2 });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { targetDate: new Date('2026-07-22T00:00:00.000Z') } })
    );
  });

  it('不正なペイロードを拒否する', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/ml/predictions', {
        method: 'POST',
        headers: { 'x-api-key': 'test-key' },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });
});
