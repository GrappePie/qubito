import { NextRequest, NextResponse } from "next/server";
import { verifyEntitlementsToken, hasEntitlement } from "@/lib/entitlements";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const required = searchParams.get("required");
    const aud = searchParams.get("aud") || undefined;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const payload = verifyEntitlementsToken(token, aud ?? "qubito");
    if (required && !hasEntitlement(payload, required)) {
      return NextResponse.json({ error: "Forbidden: missing entitlement" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      sub: payload.sub,
      customerId: payload.customerId ?? null,
      entitlements: payload.entitlements,
      iat: payload.iat ?? null,
      exp: payload.exp ?? null,
      iss: payload.iss ?? null,
      aud: payload.aud ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification failed";
    const status = /audience|issuer|expired|signature|invalid/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : undefined;
    const required = typeof body?.required === "string" ? body.required : undefined;
    const aud = typeof body?.aud === "string" ? body.aud : undefined;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const payload = verifyEntitlementsToken(token, aud ?? "qubito");
    if (required && !hasEntitlement(payload, required)) {
      return NextResponse.json({ error: "Forbidden: missing entitlement" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      sub: payload.sub,
      customerId: payload.customerId ?? null,
      entitlements: payload.entitlements,
      iat: payload.iat ?? null,
      exp: payload.exp ?? null,
      iss: payload.iss ?? null,
      aud: payload.aud ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification failed";
    const status = /audience|issuer|expired|signature|invalid/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

