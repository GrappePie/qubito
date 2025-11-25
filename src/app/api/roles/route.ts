import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getTenantIdFromRequest, getUserSubFromRequest } from '@/lib/tenant';
import RoleModel from '@/models/Role';
import AccountModel from '@/models/Account';
import {
  PERMISSION_CATALOG,
  PermissionCode,
  normalizePermissions,
} from '@/lib/permissions';
import type { Role } from '@/models/Role';
import type { WithId } from '@/types/common';

type RolePayload = {
  id: string;
  name: string;
  description: string | null;
  permissions: PermissionCode[];
  isAdmin: boolean;
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
    const rolesDocs = await RoleModel.find({ tenantId }).sort({
      isAdmin: -1,
      name: 1,
    });
    const roles = rolesDocs.map(serializeRole);
    return NextResponse.json({
      roles,
      availablePermissions: PERMISSION_CATALOG,
    });
  } catch (error) {
    console.error('GET /api/roles error', error);
    return NextResponse.json(
      { error: 'Error al obtener roles' },
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

    const rawName = typeof body?.name === 'string' ? body.name : '';
    const name = rawName.trim().slice(0, 80);
    if (!name) {
      return NextResponse.json({ error: 'name_required' }, { status: 400 });
    }

    const rawDescription =
      typeof body?.description === 'string' ? body.description : '';
    const description = rawDescription.trim().slice(0, 200) || null;

    const permissions = normalizePermissions(body?.permissions);
    if (permissions.length === 0) {
      return NextResponse.json(
        { error: 'permissions_required' },
        { status: 400 }
      );
    }

    const role = await RoleModel.create({
      tenantId,
      name,
      description,
      permissions,
      createdBy,
      isAdmin: false,
    });

    return NextResponse.json(
      { role: serializeRole(role) },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errObj = error as { code?: number };
    const isDuplicate = typeof errObj?.code === 'number' && errObj.code === 11000;
    const status = isDuplicate ? 409 : 500;
    const message = isDuplicate ? 'duplicate_role' : 'Error al crear rol';
    console.error('POST /api/roles error', error);
    return NextResponse.json({ error: message }, { status });
  }
}
