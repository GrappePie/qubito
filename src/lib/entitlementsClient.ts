"use client";

const DEBUG_ENTITLEMENTS =
  process.env.NEXT_PUBLIC_DEBUG_ENTITLEMENTS === "1" ||
  process.env.NEXT_PUBLIC_DEBUG_ENTITLEMENTS === "true";

type TokenResponse = {
  token: string;
  entitlements?: string[];
  customerId?: string;
  expiresIn?: number;
};

type VerifiedResponse = {
  ok: boolean;
  sub: string;
  customerId: string | null;
  entitlements: string[];
  iat: number | null;
  exp: number | null;
  iss: string | null;
  aud: string | string[] | null;
};

export async function getEntitlements(required: string = "pos.basic"): Promise<VerifiedResponse> {
  const base =
    process.env.NEXT_PUBLIC_ENTITLEMENTS_BASE_URL || process.env.ENTITLEMENTS_BASE_URL || "";
  if (!base) throw new Error("Missing ENTITLEMENTS_BASE_URL/NEXT_PUBLIC_ENTITLEMENTS_BASE_URL");

  // TEMP DEBUG: log outgoing request to entitlements token endpoint
  if (DEBUG_ENTITLEMENTS)
    console.log("[Entitlements] POST", `${base}/api/entitlements/token`, {
      entitlementCode: required,
      aud: "qubito",
    });

  const tokenResp = await fetch(`${base}/api/entitlements/token`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entitlementCode: required, aud: "qubito" }),
  });

  if (DEBUG_ENTITLEMENTS)
    console.log("[Entitlements] Token response status:", tokenResp.status, "ok:", tokenResp.ok);

  if (tokenResp.status === 401) {
    throw new Error("unauthenticated");
  }
  if (tokenResp.status === 403) {
    throw new Error("forbidden");
  }
  if (!tokenResp.ok) {
    throw new Error(`token_error_${tokenResp.status}`);
  }

  const { token } = (await tokenResp.json()) as TokenResponse;
  // Avoid logging the raw token; just length metadata
  if (DEBUG_ENTITLEMENTS)
    console.log(
      "[Entitlements] Token body received:",
      token ? { tokenLength: token.length } : { token: "missing" }
    );
  if (!token) throw new Error("missing_token");

  if (DEBUG_ENTITLEMENTS)
    console.log("[Entitlements] Verifying token via /api/qubito/entitlements");
  const verifyResp = await fetch("/api/qubito/entitlements", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, required, aud: "qubito" }),
  });

  if (DEBUG_ENTITLEMENTS)
    console.log(
      "[Entitlements] Verify response status:",
      verifyResp.status,
      "ok:",
      verifyResp.ok
    );
  if (verifyResp.status === 401) throw new Error("invalid_or_expired");
  if (verifyResp.status === 403) throw new Error("missing_entitlement");
  if (!verifyResp.ok) throw new Error(`verify_error_${verifyResp.status}`);

  const verified = (await verifyResp.json()) as VerifiedResponse;
  if (DEBUG_ENTITLEMENTS)
    console.log("[Entitlements] Verified payload:", {
      ok: verified.ok,
      sub: verified.sub,
      customerId: verified.customerId,
      entitlements: verified.entitlements,
      iat: verified.iat,
      exp: verified.exp,
      iss: verified.iss,
      aud: verified.aud,
    });

  return verified;
}
