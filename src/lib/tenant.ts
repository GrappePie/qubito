import { NextRequest } from 'next/server';
import { readSessionFromRequest } from './auth';

const TENANT_ENV_KEYS = ['DEFAULT_TENANT_ID', 'ENTITLEMENTS_DEFAULT_TENANT', 'NEXT_PUBLIC_DEFAULT_TENANT'] as const;

// Allow a configurable pattern via env; default to a safe, generic identifier.
const DEFAULT_TENANT_REGEX = /^[A-Za-z0-9._-]{3,128}$/;
const PATTERN = process.env.TENANT_ID_PATTERN;
let TENANT_ID_REGEX: RegExp = DEFAULT_TENANT_REGEX;
if (PATTERN) {
  try {
    TENANT_ID_REGEX = new RegExp(PATTERN);
  } catch {
    TENANT_ID_REGEX = DEFAULT_TENANT_REGEX;
  }
}

function isTenantId(s: string) {
  return TENANT_ID_REGEX.test(s);
}

export function getTenantIdFromRequest(req: NextRequest): string {
  const session = readSessionFromRequest(req);
  if (session?.tenantId && isTenantId(session.tenantId)) return session.tenantId;

  const header = req.headers.get('x-tenant-id')?.trim();
  if (header && isTenantId(header)) return header;

  // Fallback: support query param ?tenantId=
  try {
    const url = new URL(req.url);
    const qp = url.searchParams.get('tenantId')?.trim();
    if (qp && isTenantId(qp)) return qp;
  } catch {}

  // Fallback: environment defaults (for dev/testing)
  for (const k of TENANT_ENV_KEYS) {
    const v = process.env[k];
    if (v && isTenantId(v.trim())) return v.trim();
  }

  throw new Error('missing_tenant');
}

export function getUserSubFromRequest(req: NextRequest): string | null {
  const sub = req.headers.get('x-user-sub')?.trim() || null;
  if (!sub) return null;
  return /^[a-zA-Z0-9_\-]+$/.test(sub) ? sub : null;
}

export function isValidTenantId(val: string) {
  return isTenantId(val);
}
