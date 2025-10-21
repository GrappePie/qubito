import { NextRequest } from 'next/server';

export function getTenantIdFromRequest(req: NextRequest): string {
  const header = req.headers.get('x-tenant-id')?.trim();
  if (!header) {
    throw new Error('missing_tenant');
  }
  // Defensive: allow only safe id charset
  if (!/^[a-zA-Z0-9_\-]+$/.test(header)) {
    throw new Error('invalid_tenant');
  }
  return header;
}

export function getUserSubFromRequest(req: NextRequest): string | null {
  const sub = req.headers.get('x-user-sub')?.trim() || null;
  if (!sub) return null;
  return /^[a-zA-Z0-9_\-]+$/.test(sub) ? sub : null;
}

