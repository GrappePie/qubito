import { NextRequest, NextResponse } from "next/server";
import { verifyEntitlementsToken, hasAppEntitlement, hasEntitlement } from "@/lib/entitlements";
import { connectToDatabase } from "@/lib/mongodb";
import AccountModel from "@/models/Account";
import RoleModel from "@/models/Role";
import type { EntitlementsPayload } from "@/lib/entitlements";
import { DEFAULT_ADMIN_PERMISSIONS, DEFAULT_STAFF_PERMISSIONS } from "@/lib/permissions";
import { setSessionCookie, signSession } from "@/lib/auth";
import { resolveQubitoTenantId } from "@/lib/qubitoPlatform";

const DEBUG =
  process.env.ENTITLEMENTS_DEBUG === "1" || process.env.ENTITLEMENTS_DEBUG === "true";
async function ensureAdminRole(tenantId: string, createdBy: string) {
  let role = await RoleModel.findOne({ tenantId, isAdmin: true });
  if (!role) {
    role = await RoleModel.create({
      tenantId,
      name: "Administrador",
      description: "Acceso completo al sistema.",
      permissions: DEFAULT_ADMIN_PERMISSIONS,
      isAdmin: true,
      createdBy,
    });
  }
  return role;
}

async function ensureStaffRole(tenantId: string, createdBy: string) {
  let role = await RoleModel.findOne({ tenantId, name: "Operador" });
  if (!role) {
    role = await RoleModel.create({
      tenantId,
      name: "Operador",
      description: "Acceso operativo basico.",
      permissions: DEFAULT_STAFF_PERMISSIONS,
      isAdmin: false,
      createdBy,
    });
  }
  return role;
}

async function ensureAccountForUser(params: { tenantId: string; userId: string }) {
  const { tenantId, userId } = params;
  let account = await AccountModel.findOne({ tenantId, userId });
  if (account) return { account, created: false };

  const hasAnyAccount = Boolean(await AccountModel.exists({ tenantId }));
  let role;
  if (!hasAnyAccount) {
    role = await ensureAdminRole(tenantId, userId);
    account = await AccountModel.create({
      tenantId,
      userId,
      displayName: null,
      email: null,
      roleId: role._id,
      isAdmin: true,
      createdBy: userId,
    });
    return { account, created: true };
  }

  role = await ensureStaffRole(tenantId, userId);
  account = await AccountModel.create({
    tenantId,
    userId,
    displayName: null,
    email: null,
    roleId: role._id,
    isAdmin: false,
    createdBy: userId,
  });
  return { account, created: true };
}

function hasRequiredQubitoAccess(payload: EntitlementsPayload, required?: string | null) {
  if (required?.trim()) return hasEntitlement(payload, required.trim());
  return hasAppEntitlement(payload, "qubito");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const required = searchParams.get("required");
    const aud = searchParams.get("aud") || undefined;

    if (DEBUG)
      console.log("[Entitlements API] GET verify", {
        tokenLength: token ? token.length : 0,
        required,
        aud,
      });

    if (!token) {
      if (DEBUG) console.warn("[Entitlements API] GET: missing token");
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const payload = verifyEntitlementsToken(token, aud ?? "qubito");
    if (!hasRequiredQubitoAccess(payload, required)) {
      if (DEBUG)
        console.warn("[Entitlements API] GET: missing entitlement", {
          required: required || "qubito.*",
          entitlements: payload.entitlements,
        });
      return NextResponse.json({ error: "Forbidden: missing entitlement" }, { status: 403 });
    }

    const resolvedTenant = await resolveQubitoTenantId(payload, required);
    const resp = {
      ok: true,
      sub: payload.sub,
      customerId: payload.customerId ?? null,
      tenantId: resolvedTenant.tenantId,
      entitlements: payload.entitlements,
      iat: payload.iat ?? null,
      exp: payload.exp ?? null,
      iss: payload.iss ?? null,
      aud: payload.aud ?? null,
    } as const;

    if (DEBUG)
      console.log("[Entitlements API] GET: verified", {
        ok: resp.ok,
        sub: resp.sub,
        customerId: resp.customerId,
        tenantId: resp.tenantId,
        entitlements: resp.entitlements,
        iat: resp.iat,
        exp: resp.exp,
        iss: resp.iss,
        aud: resp.aud,
      });

    return NextResponse.json(resp);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification failed";
    const status = /audience|issuer|expired|signature|invalid/i.test(message) ? 401 : 500;
    if (DEBUG)
      console.error("[Entitlements API] GET: error", { status, message });
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : undefined;
    const required = typeof body?.required === "string" ? body.required : undefined;
    const aud = typeof body?.aud === "string" ? body.aud : undefined;
    const issueSession = body?.issueSession === true;

    if (DEBUG)
      console.log("[Entitlements API] POST verify", {
        tokenLength: token ? token.length : 0,
        required,
        aud,
      });

    if (!token) {
      if (DEBUG) console.warn("[Entitlements API] POST: missing token");
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const payload = verifyEntitlementsToken(token, aud ?? "qubito");
    if (!hasRequiredQubitoAccess(payload, required)) {
      if (DEBUG)
        console.warn("[Entitlements API] POST: missing entitlement", {
          required: required || "qubito.*",
          entitlements: payload.entitlements,
        });
      return NextResponse.json({ error: "Forbidden: missing entitlement" }, { status: 403 });
    }

    const resolvedTenant = await resolveQubitoTenantId(payload, required);
    const resp = {
      ok: true,
      sub: payload.sub,
      customerId: payload.customerId ?? null,
      tenantId: resolvedTenant.tenantId,
      entitlements: payload.entitlements,
      iat: payload.iat ?? null,
      exp: payload.exp ?? null,
      iss: payload.iss ?? null,
      aud: payload.aud ?? null,
    } as const;

    if (DEBUG)
      console.log("[Entitlements API] POST: verified", {
        ok: resp.ok,
        sub: resp.sub,
        customerId: resp.customerId,
        tenantId: resp.tenantId,
        entitlements: resp.entitlements,
        iat: resp.iat,
        exp: resp.exp,
        iss: resp.iss,
        aud: resp.aud,
      });

    const response = NextResponse.json(resp);

    if (issueSession) {
      const tenantId = resolvedTenant.tenantId;
      if (!tenantId) {
        return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
      }
      await connectToDatabase();
      await ensureAccountForUser({ tenantId, userId: payload.sub });
      const sessionToken = signSession({ sub: payload.sub, tenantId });
      setSessionCookie(response, sessionToken);
    }

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification failed";
    const status = /audience|issuer|expired|signature|invalid/i.test(message) ? 401 : 500;
    if (DEBUG)
      console.error("[Entitlements API] POST: error", { status, message });
    return NextResponse.json({ error: message }, { status });
  }
}
