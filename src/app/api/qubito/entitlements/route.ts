import { NextRequest, NextResponse } from "next/server";
import { verifyEntitlementsToken, hasEntitlement } from "@/lib/entitlements";
import { connectToDatabase } from "@/lib/mongodb";
import AccountModel from "@/models/Account";
import RoleModel from "@/models/Role";
import type { EntitlementsPayload } from "@/lib/entitlements";
import { DEFAULT_ADMIN_PERMISSIONS, DEFAULT_STAFF_PERMISSIONS } from "@/lib/permissions";
import { setSessionCookie, signSession } from "@/lib/auth";

const DEBUG =
  process.env.ENTITLEMENTS_DEBUG === "1" || process.env.ENTITLEMENTS_DEBUG === "true";
const ENTITLEMENTS_BASE_URL =
  process.env.ENTITLEMENTS_BASE_URL || process.env.NEXT_PUBLIC_ENTITLEMENTS_BASE_URL || "";
const PLATFORM_API_KEY = process.env.ENTITLEMENTS_API_KEY || "";

type PlatformBootstrapResponse = {
  binding?: {
    bindingType?: string;
    bindingValue?: string;
  } | null;
};

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

function pickEntitlementCode(payload: EntitlementsPayload, required?: string | null) {
  if (required?.trim()) return required.trim();
  const preferred = payload.entitlements.find((code) => /^pos\./i.test(code));
  return preferred || payload.entitlements[0] || undefined;
}

async function resolveTenantId(payload: EntitlementsPayload, required?: string | null) {
  const legacyTenantId = payload.customerId ?? payload.sub;
  const customerId = payload.customerId?.trim();

  if (!customerId || !ENTITLEMENTS_BASE_URL.trim() || !PLATFORM_API_KEY.trim()) {
    return { tenantId: legacyTenantId, source: "legacy" as const };
  }

  const entitlementCode = pickEntitlementCode(payload, required);
  try {
    const response = await fetch(
      `${ENTITLEMENTS_BASE_URL.replace(/\/$/, "")}/api/apps/bootstrap`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": PLATFORM_API_KEY,
        },
        cache: "no-store",
        body: JSON.stringify({
          customerId,
          appSlug: "qubito",
          entitlementCode,
          bindingType: "tenant",
        }),
      }
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (DEBUG) {
        console.warn("[Entitlements API] Platform bootstrap unavailable, using legacy tenant", {
          status: response.status,
          error: body.error || null,
          customerId,
        });
      }
      return { tenantId: legacyTenantId, source: "legacy" as const };
    }

    const platform = (await response.json()) as PlatformBootstrapResponse;
    const tenantId =
      platform.binding?.bindingType === "tenant" ? platform.binding.bindingValue?.trim() : "";

    if (!tenantId) {
      if (DEBUG) {
        console.warn("[Entitlements API] Platform bootstrap returned no tenant binding, using legacy tenant", {
          customerId,
        });
      }
      return { tenantId: legacyTenantId, source: "legacy" as const };
    }

    return { tenantId, source: "platform" as const };
  } catch (error) {
    if (DEBUG) {
      console.warn("[Entitlements API] Platform bootstrap request failed, using legacy tenant", {
        customerId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return { tenantId: legacyTenantId, source: "legacy" as const };
  }
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
    if (required && !hasEntitlement(payload, required)) {
      if (DEBUG)
        console.warn("[Entitlements API] GET: missing entitlement", {
          required,
          entitlements: payload.entitlements,
        });
      return NextResponse.json({ error: "Forbidden: missing entitlement" }, { status: 403 });
    }

    const resolvedTenant = await resolveTenantId(payload, required);
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
    if (required && !hasEntitlement(payload, required)) {
      if (DEBUG)
        console.warn("[Entitlements API] POST: missing entitlement", {
          required,
          entitlements: payload.entitlements,
        });
      return NextResponse.json({ error: "Forbidden: missing entitlement" }, { status: 403 });
    }

    const resolvedTenant = await resolveTenantId(payload, required);
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
