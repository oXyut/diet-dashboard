import { createHmac, randomBytes } from 'crypto';

const PAIRING_CODE_BYTES = 9;
const DEVICE_TOKEN_BYTES = 32;

function getPepper(): string | null {
  return process.env.MOBILE_TOKEN_PEPPER ?? null;
}

function hash(value: string, namespace: 'pairing-code' | 'device-token'): string | null {
  const pepper = getPepper();

  if (!pepper) {
    return null;
  }

  return createHmac('sha256', pepper).update(`${namespace}:${value}`).digest('hex');
}

export function hashPairingCode(code: string): string | null {
  return hash(normalizePairingCode(code), 'pairing-code');
}

export function hashDeviceToken(token: string): string | null {
  return hash(token, 'device-token');
}

export function normalizePairingCode(code: string): string {
  return code.trim().replace(/-/g, '').toUpperCase();
}

export function createPairingCode(): string {
  return randomBytes(PAIRING_CODE_BYTES).toString('hex').toUpperCase();
}

export function createDeviceToken(): string {
  return randomBytes(DEVICE_TOKEN_BYTES).toString('base64url');
}

export function pairingCodeTtlMinutes(): number {
  const configured = Number(process.env.PAIRING_CODE_TTL_MINUTES ?? 10);

  if (!Number.isInteger(configured) || configured < 1 || configured > 60) {
    return 10;
  }

  return configured;
}
