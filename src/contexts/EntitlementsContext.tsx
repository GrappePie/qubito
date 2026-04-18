"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getEntitlements } from "@/lib/entitlementsClient";

const DEBUG_ENTITLEMENTS =
  process.env.NEXT_PUBLIC_DEBUG_ENTITLEMENTS === "1" ||
  process.env.NEXT_PUBLIC_DEBUG_ENTITLEMENTS === "true";

const BYPASS_ENTITLEMENTS = true;

const TENANT_ID_REGEX = /^[A-Za-z0-9._-]{3,128}$/;

function normalizeTenantId(val: string | null | undefined) {
  const v = (val || "").trim();
  return v && TENANT_ID_REGEX.test(v) ? v : "";
}

function readTenantHint(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = normalizeTenantId(params.get("tenantId"));
    if (fromUrl) return fromUrl;
  } catch {}
  try {
    const fromStorage = normalizeTenantId(window.localStorage.getItem("qubito_tenant"));
    if (fromStorage) return fromStorage;
  } catch {}
  const fromEnv = normalizeTenantId(process.env.NEXT_PUBLIC_DEFAULT_TENANT || "");
  return fromEnv || null;
}

export type VerifiedEntitlements = {
  ok: boolean;
  sub: string;
  customerId: string | null;
  tenantId: string | null;
  entitlements: string[];
  iat: number | null;
  exp: number | null;
  iss: string | null;
  aud: string | string[] | null;
};

type EntitlementsState = {
  loading: boolean;
  data: VerifiedEntitlements | null;
  error: string | null;
  forbidden: boolean;
  refresh: () => Promise<void>;
};

const EntitlementsContext = createContext<EntitlementsState | null>(null);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerifiedEntitlements | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const shouldBypass = useMemo(() => {
    return BYPASS_ENTITLEMENTS;
  }, []);

  const refresh = useCallback(async () => {
    if (DEBUG_ENTITLEMENTS) console.log("[EntitlementsContext] refresh() starting");
    setLoading(true);
    setError(null);
    setForbidden(false);

    if (shouldBypass) {
      if (DEBUG_ENTITLEMENTS) console.log("[EntitlementsContext] bypassing entitlements");
      const defaultTenant = process.env.NEXT_PUBLIC_DEFAULT_TENANT || process.env.DEFAULT_TENANT_ID || null;
      const local: VerifiedEntitlements = {
        ok: true,
        sub: "local-dev",
        customerId: defaultTenant,
        tenantId: defaultTenant,
        entitlements: ["qubito.apprentice"],
        iat: null,
        exp: null,
        iss: "localhost",
        aud: "qubito",
      };
      // Persist tenant hints for API calls
      try {
        if (typeof window !== 'undefined') {
          const tenant = local.tenantId ?? local.customerId ?? local.sub;
          window.localStorage.setItem('qubito_tenant', tenant);
          window.localStorage.setItem('qubito_sub', local.sub);
        }
      } catch {}
      setData(local);
      setLoading(false);
      return;
    }

    try {
      const res = await getEntitlements();
      // Persist tenant hints for API calls
      try {
        if (typeof window !== 'undefined') {
          const tenant = (res.tenantId ?? res.customerId ?? res.sub) as string;
          window.localStorage.setItem('qubito_tenant', tenant);
          window.localStorage.setItem('qubito_sub', res.sub);
        }
      } catch {}
      setData(res);
      if (DEBUG_ENTITLEMENTS)
        console.log("[EntitlementsContext] refresh() success", {
          sub: res.sub,
          customerId: res.customerId,
          tenantId: res.tenantId,
          entitlements: res.entitlements,
        });
      setData(res);
      setLoading(false);
      return;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (DEBUG_ENTITLEMENTS) console.error("[EntitlementsContext] refresh() error", msg);
      // Handle known markers from getEntitlements
      if (msg === "unauthenticated") {
        const tenantHint = readTenantHint();
        if (tenantHint) {
          try {
            window.localStorage.setItem("qubito_tenant", tenantHint);
          } catch {}
          if (typeof window !== "undefined" && window.location.pathname.startsWith("/login")) {
            setError(msg);
            return;
          }
        }
        const base = process.env.NEXT_PUBLIC_ENTITLEMENTS_BASE_URL || process.env.ENTITLEMENTS_BASE_URL || "";
        // On unauthenticated, send users to landing sign-in with a redirect
        // back to the Qubito origin (not the full path), as requested.
        const current = typeof window !== "undefined" ? window.location.origin : "/";
        if (base) {
          const loginUrl = `${base.replace(/\/$/, "")}/sign-in?redirect=${encodeURIComponent(current)}`;
          // Redirect to landing login.
          if (DEBUG_ENTITLEMENTS) console.log("[EntitlementsContext] redirecting to login:", loginUrl);
          window.location.replace(loginUrl);
          return;
        }
      }
      if (msg === "missing_entitlement" || msg === "forbidden") {
        setData(null);
        setForbidden(true);
        setError(msg);
      } else {
        setData(null);
        setError(msg);
      }
    } finally {
      if (DEBUG_ENTITLEMENTS) console.log("[EntitlementsContext] refresh() finished");
      setLoading(false);
    }
  }, [shouldBypass]);

  useEffect(() => {
    // Fire once on mount
    refresh();
  }, [refresh]);

  const value = useMemo<EntitlementsState>(() => ({ loading, data, error, forbidden, refresh }), [loading, data, error, forbidden, refresh]);

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error("useEntitlements must be used within EntitlementsProvider");
  return ctx;
}
