import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AccountModel from "@/models/Account";
import RoleModel from "@/models/Role";
import { verifyEntitlementsToken } from "@/lib/entitlements";
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth";
import { normalizePermissions } from "@/lib/permissions";
import { resolveQubitoTenantId } from "@/lib/qubitoPlatform";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const token = typeof body?.token === "string" ? body.token : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json({ error: "missing_recovery_token" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "weak_password" }, { status: 400 });
    }

    const payload = verifyEntitlementsToken(token, "qubito-recovery");
    if (payload.purpose !== "qubito_local_recovery") {
      return NextResponse.json({ error: "invalid_recovery_token" }, { status: 401 });
    }

    const resolvedTenant = await resolveQubitoTenantId(payload);
    const tenantId = resolvedTenant.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "missing_tenant" }, { status: 400 });
    }

    const account = await AccountModel.findOne({
      tenantId,
      isAdmin: true,
      $or: [{ userId: payload.sub }, { createdBy: payload.sub }],
    });

    if (!account) {
      return NextResponse.json({ error: "admin_not_found" }, { status: 404 });
    }

    account.passwordHash = await hashPassword(password);
    await account.save();

    const role = account.roleId
      ? await RoleModel.findOne({ _id: account.roleId, tenantId })
      : null;

    const response = NextResponse.json({
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
        permissions: normalizePermissions(role?.permissions ?? []),
      },
    });

    const sessionToken = signSession({
      sub: account.userId,
      tenantId,
      roleId: account.roleId ? account.roleId.toString() : null,
      isAdmin: account.isAdmin,
    });
    setSessionCookie(response, sessionToken);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "recover_error";
    const status = /audience|issuer|expired|signature|invalid/i.test(message) ? 401 : 500;
    console.error("POST /api/auth/recover-local-login error", error);
    return NextResponse.json({ error: message }, { status });
  }
}
