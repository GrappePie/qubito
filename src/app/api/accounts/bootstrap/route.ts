import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getTenantIdFromRequest } from '@/lib/tenant';
import AccountModel from '@/models/Account';
import RoleModel from '@/models/Role';
import {
  DEFAULT_ADMIN_PERMISSIONS,
  PERMISSION_CATALOG,
  PermissionCode,
  normalizePermissions,
} from '@/lib/permissions';
import { hashPassword } from '@/lib/auth';
import type { Account } from '@/models/Account';
import type { Role } from '@/models/Role';
import type { WithId } from '@/types/common';

type AccountPayload = {
  id: string;
  tenantId: string;
  userId: string;
  displayName: string | null;
  email: string | null;
  roleId: string | null;
  roleName: string | null;
  isAdmin: boolean;
  permissions: PermissionCode[];
};

function serializeAccount(doc: WithId<Account>, role?: WithId<Role> | null): AccountPayload {
  const permissions = normalizePermissions(role?.permissions ?? []);
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId,
    userId: doc.userId,
    displayName: doc.displayName ?? null,
    email: doc.email ?? null,
    roleId: doc.roleId ? doc.roleId.toString() : null,
    roleName: role?.name ?? null,
    isAdmin: Boolean(doc.isAdmin),
    permissions,
  };
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const tenantId =
      new URL(req.url).searchParams.get('tenantId')?.trim() || getTenantIdFromRequest(req);
    const userId = null;

    const hasAdmin = Boolean(
      await AccountModel.exists({ tenantId, isAdmin: true })
    );

    let currentAccount: AccountPayload | null = null;
    if (userId) {
      const accountDoc = await AccountModel.findOne({ tenantId, userId });
      if (accountDoc) {
        const roleDoc = accountDoc.roleId
          ? await RoleModel.findOne({ _id: accountDoc.roleId, tenantId })
          : null;
        currentAccount = serializeAccount(accountDoc, roleDoc ?? undefined);
      }
    }

    return NextResponse.json({
      tenantId,
      hasAdmin,
      needsBootstrap: !hasAdmin,
      currentAccount,
      availablePermissions: PERMISSION_CATALOG,
    });
  } catch (error) {
    console.error('GET /api/accounts/bootstrap error', error);
    return NextResponse.json(
      { error: 'Error revisando la configuracion de cuentas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const tenantId = getTenantIdFromRequest(req);
    const userIdRaw = typeof body?.userId === 'string' ? body.userId.trim() : '';
    if (!userIdRaw) {
      return NextResponse.json({ error: 'missing_user' }, { status: 400 });
    }
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'weak_password' }, { status: 400 });
    }

    const rawName = typeof body?.displayName === 'string' ? body.displayName : '';
    const rawEmail = typeof body?.email === 'string' ? body.email : '';
    const displayName = rawName.trim().slice(0, 80) || 'Administrador';
    const email = rawEmail.trim().slice(0, 120) || null;

    const hasAdmin = Boolean(
      await AccountModel.exists({ tenantId, isAdmin: true })
    );
    if (hasAdmin) {
      return NextResponse.json(
        { error: 'admin_exists' },
        { status: 409 }
      );
    }

    let adminRole = await RoleModel.findOne({ tenantId, isAdmin: true });
    if (!adminRole) {
      adminRole = await RoleModel.create({
        tenantId,
        name: 'Administrador',
        description: 'Acceso completo al sistema.',
        permissions: DEFAULT_ADMIN_PERMISSIONS,
        isAdmin: true,
        createdBy: userIdRaw,
      });
    }

    const passwordHash = await hashPassword(password);

    const account = await AccountModel.create({
      tenantId,
      userId: userIdRaw,
      displayName,
      email,
      roleId: adminRole._id,
      isAdmin: true,
      createdBy: userIdRaw,
      passwordHash,
    });

    return NextResponse.json(
      {
        ok: true,
        tenantId,
        account: serializeAccount(account, adminRole),
        role: {
          id: adminRole._id.toString(),
          name: adminRole.name,
          description: adminRole.description ?? null,
          permissions: normalizePermissions(adminRole.permissions),
          isAdmin: Boolean(adminRole.isAdmin),
        },
        availablePermissions: PERMISSION_CATALOG,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errObj = error as { message?: string; code?: number };
    const message = errObj?.message || 'Error creando administrador';
    const isDuplicate = typeof errObj?.code === 'number' && errObj.code === 11000;
    const status = isDuplicate ? 409 : 500;
    console.error('POST /api/accounts/bootstrap error', error);
    return NextResponse.json({ error: message }, { status });
  }
}
