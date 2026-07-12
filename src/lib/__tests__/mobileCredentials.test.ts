import { afterEach, describe, expect, it } from 'vitest';
import {
  createDeviceToken,
  createPairingCode,
  hashDeviceToken,
  hashPairingCode,
  normalizePairingCode,
  pairingCodeTtlMinutes,
} from '../mobileCredentials';

const originalPepper = process.env.MOBILE_TOKEN_PEPPER;
const originalTtl = process.env.PAIRING_CODE_TTL_MINUTES;

afterEach(() => {
  if (originalPepper === undefined) delete process.env.MOBILE_TOKEN_PEPPER;
  else process.env.MOBILE_TOKEN_PEPPER = originalPepper;
  if (originalTtl === undefined) delete process.env.PAIRING_CODE_TTL_MINUTES;
  else process.env.PAIRING_CODE_TTL_MINUTES = originalTtl;
});

describe('mobileCredentials', () => {
  it('同じペアリングコードを表記ゆれなしでハッシュ化する', () => {
    process.env.MOBILE_TOKEN_PEPPER = 'test-pepper';

    expect(normalizePairingCode(' ab-cd ')).toBe('ABCD');
    expect(hashPairingCode('ab-cd')).toBe(hashPairingCode('ABCD'));
  });

  it('ペッパー未設定時はハッシュ化を拒否する', () => {
    delete process.env.MOBILE_TOKEN_PEPPER;

    expect(hashDeviceToken('device-token')).toBeNull();
    expect(hashPairingCode('AABBCC')).toBeNull();
  });

  it('推測困難な形式のコードと端末トークンを生成する', () => {
    expect(createPairingCode()).toMatch(/^[A-F0-9]{18}$/);
    expect(createDeviceToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('ペアリングコードの有効期限を1〜60分に制限する', () => {
    process.env.PAIRING_CODE_TTL_MINUTES = '25';
    expect(pairingCodeTtlMinutes()).toBe(25);

    process.env.PAIRING_CODE_TTL_MINUTES = '0';
    expect(pairingCodeTtlMinutes()).toBe(10);

    process.env.PAIRING_CODE_TTL_MINUTES = '61';
    expect(pairingCodeTtlMinutes()).toBe(10);
  });
});
