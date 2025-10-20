import { NextRequest, NextResponse } from "next/server";
import { verifyEntitlementsToken, hasEntitlement } from "@/lib/entitlements";

const DEBUG =
  process.env.ENTITLEMENTS_DEBUG === "1" || process.env.ENTITLEMENTS_DEBUG === "true";

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

    const resp = {
      ok: true,
      sub: payload.sub,
      customerId: payload.customerId ?? null,
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

    const resp = {
      ok: true,
      sub: payload.sub,
      customerId: payload.customerId ?? null,
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
      console.error("[Entitlements API] POST: error", { status, message });
    return NextResponse.json({ error: message }, { status });
  }
}
