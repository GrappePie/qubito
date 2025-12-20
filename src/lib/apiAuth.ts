import { NextRequest, NextResponse } from 'next/server';
import { getSessionAccount } from './authAccount';
import type { PermissionCode } from './permissions';

type GuardContext = NonNullable<Awaited<ReturnType<typeof getSessionAccount>>>;

function hasPermissions(
  ctx: GuardContext,
  required?: PermissionCode | PermissionCode[]
) {
  if (!required) return true;
  if (ctx.account.isAdmin) return true;
  const perms = new Set(ctx.rolePerms ?? []);
  const needs = Array.isArray(required) ? required : [required];
  return needs.every((code) => perms.has(code as PermissionCode));
}

/**
 * Validate session from cookie and optional permissions.
 * Returns either the hydrated account context or a NextResponse with the proper status.
 */
export async function requireAuth(
  req: NextRequest,
  required?: PermissionCode | PermissionCode[]
): Promise<{ ok: true; ctx: GuardContext } | { ok: false; res: NextResponse }> {
  const ctx = await getSessionAccount(req);
  if (!ctx) {
    return { ok: false, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) };
  }
  if (!hasPermissions(ctx, required)) {
    return { ok: false, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }
  return { ok: true, ctx };
}
