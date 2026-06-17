import jwt from "jsonwebtoken";
import { createPublicKey, type JsonWebKey as NodeJsonWebKey } from "node:crypto";
import {
  assertEntitlementTokenPayload,
  getEntitlementAppSlug,
  hasAppEntitlement,
  hasEntitlement,
  type EntitlementTokenPayload,
} from "@pixelgrimoire/license-contracts";

export type EntitlementsPayload = EntitlementTokenPayload;

const ENTITLEMENTS_SECRET = process.env.ENTITLEMENTS_JWT_SECRET;
const ENTITLEMENTS_BASE_URL = process.env.ENTITLEMENTS_BASE_URL || "https://pixelgrimoire.com";
const ENTITLEMENTS_JWKS_URL =
  process.env.ENTITLEMENTS_JWKS_URL || `${ENTITLEMENTS_BASE_URL.replace(/\/$/, "")}/api/.well-known/jwks.json`;

// Allow configuring the expected JWT issuer. Defaults to the documented value
// and supports a comma-separated list for safe rotations. jsonwebtoken's types
// require non-empty tuple for multiple issuers.
const DEFAULT_ISSUER = "pixelgrimoire-entitlements";
const ISSUER_ENV = process.env.ENTITLEMENTS_ISSUER;
const ISSUERS = ISSUER_ENV
  ? ISSUER_ENV.split(",").map((s) => s.trim()).filter(Boolean)
  : [] as string[];
const ENTITLEMENTS_ISSUER: string | [string, ...string[]] =
  ISSUERS.length === 0
    ? DEFAULT_ISSUER
    : ISSUERS.length === 1
      ? ISSUERS[0]
      : [ISSUERS[0], ...ISSUERS.slice(1)];

if (!ENTITLEMENTS_SECRET) {
  // We avoid throwing at import time in Next.js edge cases; routes will guard and return 500 instead.
  // console.warn("ENTITLEMENTS_JWT_SECRET is not set; entitlements verification will fail.");
}

type Jwk = JsonWebKey & { kid?: string; alg?: string; use?: string };
type Jwks = { keys?: Jwk[] };

let jwksCache: { keys: Jwk[]; expiresAt: number } | null = null;

function getTokenHeader(token: string): { alg?: string; kid?: string } {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded !== "object" || !("header" in decoded)) return {};
  return decoded.header as { alg?: string; kid?: string };
}

async function getJwksKeys(): Promise<Jwk[]> {
  const now = Date.now();
  if (jwksCache && jwksCache.expiresAt > now) return jwksCache.keys;

  const res = await fetch(ENTITLEMENTS_JWKS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not fetch entitlements JWKS: ${res.status}`);
  const body = (await res.json()) as Jwks;
  const keys = Array.isArray(body.keys) ? body.keys : [];
  jwksCache = { keys, expiresAt: now + 5 * 60 * 1000 };
  return keys;
}

async function verifyEntitlementsTokenRS256(token: string, expectedAud: string, kid?: string): Promise<EntitlementsPayload> {
  const keys = await getJwksKeys();
  const jwk = keys.find((key) => !kid || key.kid === kid);
  if (!jwk) throw new Error("No matching entitlements JWKS key");

  const publicKey = createPublicKey({ key: jwk as NodeJsonWebKey, format: "jwk" }).export({ type: "spki", format: "pem" });
  const payload = jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    audience: expectedAud,
    issuer: ENTITLEMENTS_ISSUER,
  });

  return assertEntitlementTokenPayload(payload);
}

export async function verifyEntitlementsTokenAsync(token: string, expectedAud: string = "qubito"): Promise<EntitlementsPayload> {
  const header = getTokenHeader(token);
  if (header.alg === "RS256") {
    return verifyEntitlementsTokenRS256(token, expectedAud, header.kid);
  }

  return verifyEntitlementsToken(token, expectedAud);
}

export function verifyEntitlementsToken(token: string, expectedAud: string = "qubito"): EntitlementsPayload {
  if (!ENTITLEMENTS_SECRET) {
    throw new Error("Server missing ENTITLEMENTS_JWT_SECRET");
  }

  const payload = jwt.verify(token, ENTITLEMENTS_SECRET, {
    audience: expectedAud,
    issuer: ENTITLEMENTS_ISSUER,
  });

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid entitlements token");
  }

  console.warn("[entitlements] verified legacy HS256 token");
  return assertEntitlementTokenPayload(payload);
}

export function pickAppEntitlement(
  payload: EntitlementsPayload,
  appSlug: string,
  required?: string | null
): string | undefined {
  if (required?.trim()) return required.trim();
  const exact = payload.entitlements.find((code) => getEntitlementAppSlug(code) === appSlug.trim().toLowerCase());
  if (exact) return exact;
  return payload.entitlements[0] || undefined;
}

export { hasAppEntitlement, hasEntitlement };
