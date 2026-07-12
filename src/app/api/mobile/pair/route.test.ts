import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const tx = {
    pairingCode: { findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    mobileDevice: { create: vi.fn() },
  };
  return { tx, transaction: vi.fn() };
});

vi.mock('@/lib/prisma', () => ({
  prisma: { $transaction: mocks.transaction },
}));

vi.mock('@/lib/mobileCredentials', () => ({
  createDeviceToken: () => 'new-device-token',
  hashDeviceToken: () => 'device-token-hash',
  hashPairingCode: () => 'pairing-code-hash',
  normalizePairingCode: (code: string) => code.trim().toUpperCase(),
}));

import { POST } from './route';

describe('POST /api/mobile/pair', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((callback) => callback(mocks.tx));
  });

  it('有効な一回限りコードを端末トークンに交換する', async () => {
    mocks.tx.pairingCode.findUnique.mockResolvedValue({
      id: 'code-id',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    mocks.tx.pairingCode.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.mobileDevice.create.mockResolvedValue({
      id: 'device-id',
      name: 'My iPhone',
      createdAt: new Date('2026-07-12T00:00:00.000Z'),
    });

    const response = await POST(
      new NextRequest('http://localhost/api/mobile/pair', {
        method: 'POST',
        body: JSON.stringify({ code: 'ABC123', deviceName: 'My iPhone' }),
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ deviceToken: 'new-device-token' });
    expect(mocks.tx.mobileDevice.create).toHaveBeenCalledWith({
      data: { name: 'My iPhone', tokenHash: 'device-token-hash' },
      select: { id: true, name: true, createdAt: true },
    });
    expect(mocks.tx.pairingCode.update).toHaveBeenCalledWith({
      where: { id: 'code-id' },
      data: { deviceId: 'device-id' },
    });
  });

  it('期限切れ・使用済みコードを拒否する', async () => {
    mocks.tx.pairingCode.findUnique.mockResolvedValue({
      id: 'code-id',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() - 60_000),
    });

    const response = await POST(
      new NextRequest('http://localhost/api/mobile/pair', {
        method: 'POST',
        body: JSON.stringify({ code: 'USED', deviceName: 'My iPhone' }),
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.tx.pairingCode.updateMany).not.toHaveBeenCalled();
  });

  it('同時使用でコード取得に失敗した場合を拒否する', async () => {
    mocks.tx.pairingCode.findUnique.mockResolvedValue({
      id: 'code-id',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    mocks.tx.pairingCode.updateMany.mockResolvedValue({ count: 0 });

    const response = await POST(
      new NextRequest('http://localhost/api/mobile/pair', {
        method: 'POST',
        body: JSON.stringify({ code: 'RACE', deviceName: 'My iPhone' }),
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.tx.mobileDevice.create).not.toHaveBeenCalled();
  });
});
