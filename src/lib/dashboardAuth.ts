import { createHmac, timingSafeEqual } from 'crypto';

export const DASHBOARD_SESSION_COOKIE = 'diet_dashboard_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret(): string | null {
  return process.env.DASHBOARD_SESSION_SECRET ?? null;
}

export function isDashboardPasswordValid(password: string): boolean {
  const expected = process.env.DASHBOARD_ADMIN_PASSWORD;
  if (!expected) return false;
  const actualBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) {
    timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createDashboardSession(): string | null {
  const sessionSecret = secret();
  if (!sessionSecret) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `v1.${expiresAt}`;
  const signature = createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function isDashboardSessionValid(value: string | undefined): boolean {
  const sessionSecret = secret();
  if (!value || !sessionSecret) return false;
  const [version, expiresAtRaw, signature] = value.split('.');
  if (version !== 'v1' || !expiresAtRaw || !signature || Number(expiresAtRaw) < Date.now() / 1000) {
    return false;
  }
  const payload = `${version}.${expiresAtRaw}`;
  const expected = createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export const dashboardSessionMaxAge = SESSION_MAX_AGE_SECONDS;
