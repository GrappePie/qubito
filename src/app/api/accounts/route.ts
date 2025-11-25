import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getTenantIdFromRequest, getUserSubFromRequest } from '@/lib/tenant';
import AccountModel from '@/models/Account';
import RoleModel from '@/models/Role';
import {
  PERMISSION_CATALOG,
  PermissionCode,
  normalizePermissions,
} from '@/lib/permissions';
import { hashPassword } from '@/lib/auth';
import type { Role } from '@/models/Role';
import type { Account } from '@/models/Account';
import type { WithId } from '@/types/common';

type RolePayload = {
  id: string;
  name: string;
  description: string | null;
  permissions: PermissionCode[];
  isAdmin: boolean;
};

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

function serializeRole(doc: WithId<Role>): RolePayload {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? null,
    permissions: normalizePermissions(doc.permissions),
    isAdmin: Boolean(doc.isAdmin),
  };
}

function serializeAccount(doc: WithId<Account>, role?: RolePayload | null): AccountPayload {
  const perms = role?.permissions ?? [];
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId,
    userId: doc.userId,
    displayName: doc.displayName ?? null,
    email: doc.email ?? null,
    roleId: doc.roleId ? doc.roleId.toString() : null,
    roleName: role?.name ?? null,
    isAdmin: Boolean(doc.isAdmin),
    permissions: perms,
  };
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const tenantId = getTenantIdFromRequest(req);
    const userId = getUserSubFromRequest(req);
    const requester = userId
      ? await AccountModel.findOne({ tenantId, userId })
      : null;
    if (!requester || !requester.isAdmin) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const rolesDocs = await RoleModel.find({ tenantId });
    const roles = rolesDocs.map(serializeRole);
    const roleById = roles.reduce<Record<string, RolePayload>>((acc, r) => {
      acc[r.id] = r;
      return acc;
    }, {});

    const accountsDocs = await AccountModel.find({ tenantId });
    const accounts = accountsDocs.map((doc) =>
      serializeAccount(doc, doc.roleId ? roleById[doc.roleId.toString()] : null)
    );

    return NextResponse.json({
      accounts,
      roles,
      availablePermissions: PERMISSION_CATALOG,
    });
  } catch (error) {
    console.error('GET /api/accounts error', error);
    return NextResponse.json(
      { error: 'Error al obtener cuentas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const tenantId = getTenantIdFromRequest(req);
    const createdBy = getUserSubFromRequest(req);
    const requester = createdBy
      ? await AccountModel.findOne({ tenantId, userId: createdBy })
      : null;
    if (!requester || !requester.isAdmin) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const rawUserId = typeof body?.userId === 'string' ? body.userId : '';
    const userId = rawUserId.trim();
    if (!userId) {
      return NextResponse.json({ error: 'userId_required' }, { status: 400 });
    }

    const rawName = typeof body?.displayName === 'string' ? body.displayName : '';
    const rawEmail = typeof body?.email === 'string' ? body.email : '';
    const displayName = rawName.trim().slice(0, 80) || null;
    const email = rawEmail.trim().slice(0, 120) || null;

    const roleId =
      typeof body?.roleId === 'string' && body.roleId.trim()
        ? body.roleId.trim()
        : null;
    if (!roleId) {
      return NextResponse.json({ error: 'role_required' }, { status: 400 });
    }

    const roleDoc = await RoleModel.findOne({ _id: roleId, tenantId });
    if (!roleDoc) {
      return NextResponse.json({ error: 'role_not_found' }, { status: 404 });
    }

    const password = typeof body?.password === 'string' ? body.password : '';
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'weak_password' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const account = await AccountModel.create({
      tenantId,
      userId,
      displayName,
      email,
      roleId: roleDoc._id,
      isAdmin: Boolean(roleDoc.isAdmin),
      createdBy,
      passwordHash,
    });

    return NextResponse.json(
      {
        account: serializeAccount(account, serializeRole(roleDoc)),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errObj = error as { code?: number; message?: string };
    const isDuplicate = typeof errObj?.code === 'number' && errObj.code === 11000;
    const status = isDuplicate ? 409 : 500;
    const message = isDuplicate ? 'account_exists' : 'Error al crear la cuenta';
    console.error('POST /api/accounts error', error);
    return NextResponse.json({ error: message }, { status });
  }
}
