import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionAccount } from '@/lib/authAccount';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const sessionData = await getSessionAccount(req);
    if (!sessionData) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    const { account, rolePerms, roleName, session } = sessionData;
    return NextResponse.json({
      ok: true,
      account: {
        id: account._id.toString(),
        tenantId: account.tenantId,
        userId: account.userId,
        displayName: account.displayName ?? null,
        email: account.email ?? null,
        roleId: account.roleId ? account.roleId.toString() : null,
        roleName,
        isAdmin: account.isAdmin,
        permissions: rolePerms,
      },
      session,
    });
  } catch (error) {
    console.error('GET /api/auth/me error', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
