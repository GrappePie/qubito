import jwt from "jsonwebtoken";

export type EntitlementsPayload = {
  sub: string;
  customerId?: string;
  entitlements: string[];
  aud?: string | string[];
  iat?: number;
  exp?: number;
  iss?: string;
} & Record<string, unknown>;

const ENTITLEMENTS_SECRET = process.env.ENTITLEMENTS_JWT_SECRET;

if (!ENTITLEMENTS_SECRET) {
  // We avoid throwing at import time in Next.js edge cases; routes will guard and return 500 instead.
  // console.warn("ENTITLEMENTS_JWT_SECRET is not set; entitlements verification will fail.");
}

export function verifyEntitlementsToken(token: string, expectedAud: string = "qubito"): EntitlementsPayload {
  if (!ENTITLEMENTS_SECRET) {
    throw new Error("Server missing ENTITLEMENTS_JWT_SECRET");
  }

  const payload = jwt.verify(token, ENTITLEMENTS_SECRET, {
    audience: expectedAud,
    issuer: "pixelgrimoire-entitlements",
  });

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid entitlements token");
  }

  const data = payload as EntitlementsPayload;
  if (!Array.isArray(data.entitlements)) {
    throw new Error("Missing entitlements array");
  }

  return data;
}

export function hasEntitlement(payload: EntitlementsPayload, code: string): boolean {
  return Array.isArray(payload.entitlements) && payload.entitlements.includes(code);
}

