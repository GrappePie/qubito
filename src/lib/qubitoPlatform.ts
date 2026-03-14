import type { EntitlementsPayload } from "@/lib/entitlements";
import { pickAppEntitlement } from "@/lib/entitlements";

const ENTITLEMENTS_BASE_URL =
  process.env.ENTITLEMENTS_BASE_URL || process.env.NEXT_PUBLIC_ENTITLEMENTS_BASE_URL || "";
const PLATFORM_API_KEY = process.env.ENTITLEMENTS_API_KEY || "";
const DEBUG =
  process.env.ENTITLEMENTS_DEBUG === "1" || process.env.ENTITLEMENTS_DEBUG === "true";

export type PlatformBootstrapResponse = {
  binding?: {
    bindingType?: string;
    bindingValue?: string;
  } | null;
};

export function pickEntitlementCode(payload: EntitlementsPayload, required?: string | null) {
  return pickAppEntitlement(payload, "qubito", required);
}

export async function resolveQubitoTenantId(
  payload: EntitlementsPayload,
  required?: string | null
) {
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
        console.warn(
          "[Entitlements API] Platform bootstrap returned no tenant binding, using legacy tenant",
          {
            customerId,
          }
        );
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
