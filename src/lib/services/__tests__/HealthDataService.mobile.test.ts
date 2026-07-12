import { describe, expect, it, vi } from 'vitest';
import { HealthDataService } from '../HealthDataService';
import { IHealthDataRepository } from '../../repositories/interfaces/IHealthDataRepository';

describe('HealthDataService mobile payloads', () => {
  it('HealthKit から取得できなかった項目を undefined のまま保持する', async () => {
    const repository = {
      findByDate: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn().mockResolvedValue({}),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as IHealthDataRepository;
    const service = new HealthDataService(repository);

    await service.recordHealthData({ date: '2026-07-12', steps: 8500 });

    expect(repository.upsert).toHaveBeenCalledWith({
      date: '2026-07-12',
      steps: 8500,
    });
  });
});
