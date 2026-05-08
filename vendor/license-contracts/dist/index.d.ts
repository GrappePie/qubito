export type ProductApp = "qubito" | "nexora";
export type PlanLevel = "apprentice" | "mage" | "archmage";
export type LicenseStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "expiring"
  | "grace"
  | "limited"
  | "expired"
  | "inactive";

export type EntitlementTokenPayload = {
  sub: string;
  customerId?: string;
  billingAccountId?: string;
  entitlements: string[];
  aud?: string | string[];
  iat?: number;
  exp?: number;
  iss?: string;
  entitlementCode?: string;
  licenseStatus?: LicenseStatus | string;
  licenseValidUntil?: string | null;
} & Record<string, unknown>;

export type NexoraLicenseProofPayload = {
  sub?: unknown;
  customerId?: unknown;
  aud?: unknown;
  entitlements?: unknown;
  entitlementCode?: unknown;
  licenseValidUntil?: unknown;
  licenseStatus?: unknown;
  _installation?: {
    key?: unknown;
  } | null;
};

export declare const DEFAULT_ENTITLEMENTS_ISSUER = "pixelgrimoire-entitlements";
export declare const LICENSE_STATUSES: readonly LicenseStatus[];
export declare const USABLE_LICENSE_STATUSES: readonly LicenseStatus[];
export declare const PRODUCT_APPS: readonly ProductApp[];
export declare const PLAN_LEVELS: readonly PlanLevel[];

export declare function isProductApp(value: unknown): value is ProductApp;
export declare function isLicenseStatus(value: unknown): value is LicenseStatus;
export declare function isUsableLicenseStatus(value: unknown): boolean;
export declare function getEntitlementAppSlug(code: string | null | undefined): ProductApp | null;
export declare function getEntitlementPlanLevel(code: string | null | undefined): PlanLevel | null;
export declare function matchesAppEntitlement(code: string | null | undefined, appSlug: string | null | undefined): boolean;
export declare function normalizeEntitlementCodeForApp(code: string | null | undefined, preferredAppSlug?: string | null): string;
export declare function isEntitlementTokenPayload(value: unknown): value is EntitlementTokenPayload;
export declare function assertEntitlementTokenPayload(value: unknown): EntitlementTokenPayload;
export declare function hasEntitlement(payload: EntitlementTokenPayload, code: string): boolean;
export declare function hasAppEntitlement(payload: EntitlementTokenPayload, appSlug: string): boolean;
