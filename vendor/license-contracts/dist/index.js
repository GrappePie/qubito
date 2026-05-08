"use strict";

const LICENSE_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "expiring",
  "grace",
  "limited",
  "expired",
  "inactive",
];

const USABLE_LICENSE_STATUSES = ["active", "trialing", "past_due", "expiring", "grace"];
const PRODUCT_APPS = ["qubito", "nexora"];
const PLAN_LEVELS = ["apprentice", "mage", "archmage"];
const DEFAULT_ENTITLEMENTS_ISSUER = "pixelgrimoire-entitlements";

const legacyAppCodes = {
  "pos.basic": "qubito",
  "pos.pro": "qubito",
  "pos.enterprise": "qubito",
  "nexora.basic": "nexora",
  "nexora.pro": "nexora",
  "nexora.enterprise": "nexora",
};

const legacyPlanLevels = {
  "pos.basic": "apprentice",
  "pos.pro": "mage",
  "pos.enterprise": "archmage",
  "nexora.basic": "apprentice",
  "nexora.pro": "mage",
  "nexora.enterprise": "archmage",
};

function normalizeString(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isProductApp(value) {
  return PRODUCT_APPS.includes(normalizeString(value));
}

function isLicenseStatus(value) {
  return LICENSE_STATUSES.includes(normalizeString(value));
}

function isUsableLicenseStatus(value) {
  return USABLE_LICENSE_STATUSES.includes(normalizeString(value));
}

function getEntitlementAppSlug(code) {
  const normalized = normalizeString(code);
  if (!normalized) return null;
  if (legacyAppCodes[normalized]) return legacyAppCodes[normalized];
  const appSlug = normalized.split(".")[0];
  return isProductApp(appSlug) ? appSlug : null;
}

function getEntitlementPlanLevel(code) {
  const normalized = normalizeString(code);
  if (!normalized) return null;
  if (legacyPlanLevels[normalized]) return legacyPlanLevels[normalized];
  const planLevel = normalized.split(".")[1];
  return PLAN_LEVELS.includes(planLevel) ? planLevel : null;
}

function matchesAppEntitlement(code, appSlug) {
  const normalizedApp = normalizeString(appSlug);
  return Boolean(normalizedApp && getEntitlementAppSlug(code) === normalizedApp);
}

function normalizeEntitlementCodeForApp(code, preferredAppSlug) {
  const normalized = normalizeString(code);
  if (!normalized) return normalized;
  const appSlug = normalizeString(preferredAppSlug) || getEntitlementAppSlug(normalized);
  const planLevel = getEntitlementPlanLevel(normalized);
  if (!appSlug || !planLevel) return normalized;
  return `${appSlug}.${planLevel}`;
}

function isEntitlementTokenPayload(value) {
  if (!value || typeof value !== "object") return false;
  const payload = value;
  return (
    typeof payload.sub === "string" &&
    Array.isArray(payload.entitlements) &&
    payload.entitlements.every((item) => typeof item === "string") &&
    (payload.customerId === undefined || typeof payload.customerId === "string") &&
    (payload.billingAccountId === undefined || typeof payload.billingAccountId === "string") &&
    (payload.aud === undefined || typeof payload.aud === "string" || Array.isArray(payload.aud)) &&
    (payload.iat === undefined || typeof payload.iat === "number") &&
    (payload.exp === undefined || typeof payload.exp === "number") &&
    (payload.iss === undefined || typeof payload.iss === "string") &&
    (payload.entitlementCode === undefined || typeof payload.entitlementCode === "string") &&
    (payload.licenseStatus === undefined || typeof payload.licenseStatus === "string") &&
    (payload.licenseValidUntil === undefined || payload.licenseValidUntil === null || typeof payload.licenseValidUntil === "string")
  );
}

function assertEntitlementTokenPayload(value) {
  if (!isEntitlementTokenPayload(value)) {
    throw new Error("Invalid entitlement token payload");
  }
  return value;
}

function hasEntitlement(payload, code) {
  return Array.isArray(payload.entitlements) && payload.entitlements.includes(code);
}

function hasAppEntitlement(payload, appSlug) {
  return Array.isArray(payload.entitlements) && payload.entitlements.some((code) => matchesAppEntitlement(code, appSlug));
}

module.exports = {
  DEFAULT_ENTITLEMENTS_ISSUER,
  LICENSE_STATUSES,
  PLAN_LEVELS,
  PRODUCT_APPS,
  USABLE_LICENSE_STATUSES,
  assertEntitlementTokenPayload,
  getEntitlementAppSlug,
  getEntitlementPlanLevel,
  hasAppEntitlement,
  hasEntitlement,
  isEntitlementTokenPayload,
  isLicenseStatus,
  isProductApp,
  isUsableLicenseStatus,
  matchesAppEntitlement,
  normalizeEntitlementCodeForApp,
};
