import { NextRequest } from 'next/server';

const TENANT_ENV_KEYS = ['DEFAULT_TENANT_ID', 'ENTITLEMENTS_DEFAULT_TENANT', 'NEXT_PUBLIC_DEFAULT_TENANT'] as const;

function isSafeId(s: string) {
  return /^[a-zA-Z0-9_\-]+$/.test(s);
}

export function getTenantIdFromRequest(req: NextRequest): string {
  const header = req.headers.get('x-tenant-id')?.trim();
  if (header && isSafeId(header)) return header;

  // Fallback: support query param ?tenantId=
  try {
    const url = new URL(req.url);
    const qp = url.searchParams.get('tenantId')?.trim();
    if (qp && isSafeId(qp)) return qp;
  } catch {}

  // Fallback: environment defaults (for dev/testing)
  for (const k of TENANT_ENV_KEYS) {
    const v = process.env[k];
    if (v && isSafeId(v.trim())) return v.trim();
  }

  throw new Error('missing_tenant');
}

export function getUserSubFromRequest(req: NextRequest): string | null {
  const sub = req.headers.get('x-user-sub')?.trim() || null;
  if (!sub) return null;
  return /^[a-zA-Z0-9_\-]+$/.test(sub) ? sub : null;
}
