"use client";

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

  const tokenResp = await fetch(`${base}/api/entitlements/token`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entitlementCode: required, aud: "qubito" }),
  });

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
  if (!token) throw new Error("missing_token");

  const verifyResp = await fetch("/api/qubito/entitlements", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, required, aud: "qubito" }),
  });

  if (verifyResp.status === 401) throw new Error("invalid_or_expired");
  if (verifyResp.status === 403) throw new Error("missing_entitlement");
  if (!verifyResp.ok) throw new Error(`verify_error_${verifyResp.status}`);

  return (await verifyResp.json()) as VerifiedResponse;
}

