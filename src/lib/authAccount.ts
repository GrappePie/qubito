import { NextRequest } from 'next/server';
import AccountModel from '@/models/Account';
import RoleModel from '@/models/Role';
import { normalizePermissions, PermissionCode } from './permissions';
import { readSessionFromRequest } from './auth';

export async function getSessionAccount(req: NextRequest) {
  const session = readSessionFromRequest(req);
  if (!session) return null;
  const account = await AccountModel.findOne({
    userId: session.sub,
    tenantId: session.tenantId,
  });
  if (!account) return null;
  let rolePerms: PermissionCode[] = [];
  let roleName: string | null = null;
  if (account.roleId) {
    const role = await RoleModel.findOne({ _id: account.roleId, tenantId: session.tenantId });
    if (role) {
      rolePerms = normalizePermissions(role.permissions);
      roleName = role.name;
    }
  }
  return {
    account,
    rolePerms,
    roleName,
    session,
  };
}
