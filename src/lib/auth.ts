import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.ENTITLEMENTS_JWT_SECRET;
export const SESSION_COOKIE = 'qubito_session';

type SessionPayload = {
  sub: string;
  tenantId: string;
  roleId?: string | null;
  isAdmin?: boolean;
};

export function requireAuthSecret() {
  if (!AUTH_SECRET) throw new Error('Missing AUTH_SECRET env var');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
  return `scrypt:${salt.toString('base64')}:${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored || typeof stored !== 'string') return false;
  const [scheme, saltB64, hashB64] = stored.split(':');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, expected.length, (err, buf) => {
      if (err) reject(err);
      else resolve(buf);
    });
  });
  return crypto.timingSafeEqual(expected, derived);
}

export function signSession(payload: SessionPayload) {
  requireAuthSecret();
  return jwt.sign(payload, AUTH_SECRET as string, { expiresIn: '12h' });
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function readSessionFromRequest(req: NextRequest): SessionPayload | null {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const decoded = jwt.verify(raw, AUTH_SECRET as string);
    if (!decoded || typeof decoded !== 'object') return null;
    const payload = decoded as SessionPayload;
    if (!payload.sub || !payload.tenantId) return null;
    return payload;
  } catch {
    return null;
  }
}
