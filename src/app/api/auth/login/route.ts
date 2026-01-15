import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import AccountModel from '@/models/Account';
import RoleModel from '@/models/Role';
import { normalizePermissions } from '@/lib/permissions';
import {
  verifyPassword,
  signSession,
  setSessionCookie,
  requireAuthSecret,
} from '@/lib/auth';
import { getTenantIdFromRequest } from '@/lib/tenant';

export async function POST(req: NextRequest) {
  try {
    requireAuthSecret();
    await connectToDatabase();
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    let tenantId = '';
    try {
      tenantId = getTenantIdFromRequest(req);
    } catch {
      tenantId = '';
    }
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!tenantId || !userId || !password) {
      return NextResponse.json({ error: 'missing_credentials' }, { status: 400 });
    }

    const account = await AccountModel.findOne({ tenantId, userId });
    if (!account || !account.passwordHash) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
    }

    const ok = await verifyPassword(password, account.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
    }

    const role = account.roleId
      ? await RoleModel.findOne({ _id: account.roleId, tenantId })
      : null;
    const permissions = normalizePermissions(role?.permissions ?? []);

    const token = signSession({
      sub: account.userId,
      tenantId,
      roleId: account.roleId ? account.roleId.toString() : null,
      isAdmin: account.isAdmin,
    });
    const res = NextResponse.json({
      ok: true,
      account: {
        id: account._id.toString(),
        tenantId,
        userId: account.userId,
        displayName: account.displayName ?? null,
        email: account.email ?? null,
        roleId: account.roleId ? account.roleId.toString() : null,
        roleName: role?.name ?? null,
        isAdmin: account.isAdmin,
        permissions,
      },
    });
    setSessionCookie(res, token);
    return res;
  } catch (error) {
    console.error('POST /api/auth/login error', error);
    return NextResponse.json({ error: 'login_error' }, { status: 500 });
  }
}
