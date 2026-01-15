import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getTenantIdFromRequest, getUserSubFromRequest } from '@/lib/tenant';
import RoleModel from '@/models/Role';
import AccountModel from '@/models/Account';
import {
  DEFAULT_ADMIN_PERMISSIONS,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const tenantId = getTenantIdFromRequest(req);
    const userId = getUserSubFromRequest(req);
    const requester = userId
      ? await AccountModel.findOne({ tenantId, userId })
      : null;
    if (!requester || !requester.isAdmin) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const role = await RoleModel.findOne({ _id: id, tenantId });
    if (!role) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (!role.isAdmin) {
      const rawName = typeof body?.name === 'string' ? body.name : '';
      if (rawName.trim()) updates.name = rawName.trim().slice(0, 80);
    }

    if (typeof body?.description === 'string') {
      updates.description = body.description.trim().slice(0, 200) || null;
    }

    if (Array.isArray(body?.permissions)) {
      const permissions = normalizePermissions(body.permissions);
      if (permissions.length === 0) {
        return NextResponse.json(
          { error: 'permissions_required' },
          { status: 400 }
        );
      }
      updates.permissions = role.isAdmin
        ? Array.from(
            new Set([...permissions, ...DEFAULT_ADMIN_PERMISSIONS])
          )
        : permissions;
    }

    const updated = await RoleModel.findOneAndUpdate(
      { _id: id, tenantId },
      updates,
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ role: serializeRole(updated) });
  } catch (error: unknown) {
    console.error('PATCH /api/roles/[id] error', error);
    return NextResponse.json(
      { error: 'error_updating_role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const tenantId = getTenantIdFromRequest(req);
    const userId = getUserSubFromRequest(req);
    const requester = userId
      ? await AccountModel.findOne({ tenantId, userId })
      : null;
    if (!requester || !requester.isAdmin) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const role = await RoleModel.findOne({ _id: id, tenantId });
    if (!role) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (role.isAdmin) {
      return NextResponse.json(
        { error: 'cannot_delete_admin_role' },
        { status: 400 }
      );
    }

    const assigned = await AccountModel.countDocuments({
      tenantId,
      roleId: id,
    });
    if (assigned > 0) {
      return NextResponse.json(
        { error: 'role_in_use' },
        { status: 400 }
      );
    }

    await RoleModel.deleteOne({ _id: id, tenantId });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('DELETE /api/roles/[id] error', error);
    return NextResponse.json(
      { error: 'error_deleting_role' },
      { status: 500 }
    );
  }
}
