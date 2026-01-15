import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import AccountModel from '@/models/Account';
import RoleModel from '@/models/Role';
import { PermissionCode, normalizePermissions } from '@/lib/permissions';
import { hashPassword } from '@/lib/auth';
import { requireAuth } from '@/lib/apiAuth';
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

function serializeRole(doc: WithId<Role>): RolePayload {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? null,
    permissions: normalizePermissions(doc.permissions),
    isAdmin: Boolean(doc.isAdmin),
  };
}

function serializeAccount(doc: WithId<Account>, role?: RolePayload | null) {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId,
    userId: doc.userId,
    displayName: doc.displayName ?? null,
    email: doc.email ?? null,
    roleId: doc.roleId ? doc.roleId.toString() : null,
    roleName: role?.name ?? null,
    isAdmin: Boolean(doc.isAdmin),
    permissions: role?.permissions ?? [],
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.res;
    const { account: requester } = auth.ctx;
    const tenantId = requester.tenantId;
    if (!requester.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const currentAccount = await AccountModel.findOne({ _id: id, tenantId });
    if (!currentAccount) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    const rawName = typeof body?.displayName === 'string' ? body.displayName : '';
    const rawEmail = typeof body?.email === 'string' ? body.email : '';
    if (rawName.trim()) updates.displayName = rawName.trim().slice(0, 80);
    if (rawEmail.trim() || rawEmail === '') {
      updates.email = rawEmail.trim().slice(0, 120) || null;
    }

    if (typeof body?.password === 'string' && body.password.trim()) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: 'weak_password' }, { status: 400 });
      }
      updates.passwordHash = await hashPassword(body.password);
    }

    let targetRole: RolePayload | null = null;
    if (typeof body?.roleId === 'string' && body.roleId.trim()) {
      const roleDoc = await RoleModel.findOne({
        _id: body.roleId.trim(),
        tenantId,
      });
      if (!roleDoc) {
        return NextResponse.json({ error: 'role_not_found' }, { status: 404 });
      }
      targetRole = serializeRole(roleDoc);
      updates.roleId = roleDoc._id;
      updates.isAdmin = Boolean(roleDoc.isAdmin);
    }

    const willRemoveAdmin =
      currentAccount.isAdmin &&
      targetRole &&
      !targetRole.isAdmin;
    if (willRemoveAdmin) {
      const otherAdmins = await AccountModel.countDocuments({
        tenantId,
        isAdmin: true,
        _id: { $ne: id },
      });
      if (otherAdmins === 0) {
        return NextResponse.json(
          { error: 'no_last_admin' },
          { status: 400 }
        );
      }
    }

    const updated = await AccountModel.findOneAndUpdate(
      { _id: id, tenantId },
      updates,
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    let roleForResponse: RolePayload | null = targetRole;
    if (!roleForResponse && updated.roleId) {
      const roleDoc = await RoleModel.findOne({
        _id: updated.roleId,
        tenantId,
      });
      if (roleDoc) roleForResponse = serializeRole(roleDoc);
    }

    return NextResponse.json({
      account: serializeAccount(updated, roleForResponse),
    });
  } catch (error: unknown) {
    console.error('PATCH /api/accounts/[id] error', error);
    return NextResponse.json(
      { error: 'error_updating_account' },
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
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.res;
    const { account: requester } = auth.ctx;
    const tenantId = requester.tenantId;
    if (!requester.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const account = await AccountModel.findOne({ _id: id, tenantId });
    if (!account) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (account.isAdmin) {
      const otherAdmins = await AccountModel.countDocuments({
        tenantId,
        isAdmin: true,
        _id: { $ne: id },
      });
      if (otherAdmins === 0) {
        return NextResponse.json(
          { error: 'no_last_admin' },
          { status: 400 }
        );
      }
    }

    await AccountModel.deleteOne({ _id: id, tenantId });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('DELETE /api/accounts/[id] error', error);
    return NextResponse.json(
      { error: 'error_deleting_account' },
      { status: 500 }
    );
  }
}
