import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { mobileDevice: { findUnique: mocks.findUnique, update: mocks.update } },
}));

vi.mock('@/lib/mobileCredentials', () => ({ hashDeviceToken: () => 'hashed-token' }));

import { withHealthWriteAuth } from '../auth';

const previousApiKey = process.env.API_SECRET_KEY;
const previousPepper = process.env.MOBILE_TOKEN_PEPPER;

afterEach(() => {
  if (previousApiKey === undefined) delete process.env.API_SECRET_KEY;
  else process.env.API_SECRET_KEY = previousApiKey;
  if (previousPepper === undefined) delete process.env.MOBILE_TOKEN_PEPPER;
  else process.env.MOBILE_TOKEN_PEPPER = previousPepper;
});

describe('withHealthWriteAuth', () => {
  const handler = vi.fn(async () => NextResponse.json({ ok: true }));

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_SECRET_KEY = 'existing-api-key';
    process.env.MOBILE_TOKEN_PEPPER = 'pepper';
  });

  it('既存の X-API-Key を引き続き受け付ける', async () => {
    const response = await withHealthWriteAuth(handler)(
      new NextRequest('http://localhost/api/health', {
        headers: { 'X-API-Key': 'existing-api-key' },
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('有効な端末トークンを受け付け、最終利用日時を更新する', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'device-id', revokedAt: null });
    mocks.update.mockResolvedValue({});

    const response = await withHealthWriteAuth(handler)(
      new NextRequest('http://localhost/api/health', {
        headers: { Authorization: 'Bearer device-token' },
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'device-id' },
      data: { lastUsedAt: expect.any(Date) },
    });
  });

  it('失効済み端末トークンを拒否する', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'device-id', revokedAt: new Date() });

    const response = await withHealthWriteAuth(handler)(
      new NextRequest('http://localhost/api/health', {
        headers: { Authorization: 'Bearer revoked-token' },
      })
    );

    expect(response.status).toBe(401);
  });
});
