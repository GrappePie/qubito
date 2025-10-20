"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getEntitlements } from "@/lib/entitlementsClient";

const DEBUG_ENTITLEMENTS =
  process.env.NEXT_PUBLIC_DEBUG_ENTITLEMENTS === "1" ||
  process.env.NEXT_PUBLIC_DEBUG_ENTITLEMENTS === "true";

export type VerifiedEntitlements = {
  ok: boolean;
  sub: string;
  customerId: string | null;
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

  const refresh = useCallback(async () => {
    if (DEBUG_ENTITLEMENTS) console.log("[EntitlementsContext] refresh() starting");
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const res = await getEntitlements("pos.basic");
      setData(res);
      if (DEBUG_ENTITLEMENTS)
        console.log("[EntitlementsContext] refresh() success", {
          sub: res.sub,
          customerId: res.customerId,
          entitlements: res.entitlements,
        });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (DEBUG_ENTITLEMENTS) console.error("[EntitlementsContext] refresh() error", msg);
      // Handle known markers from getEntitlements
      if (msg === "unauthenticated") {
        const base = process.env.NEXT_PUBLIC_ENTITLEMENTS_BASE_URL || process.env.ENTITLEMENTS_BASE_URL || "";
        const current = typeof window !== "undefined" ? window.location.href : "/";
        if (base) {
          const loginUrl = `${base.replace(/\/$/, "")}/sign-in?redirect=${encodeURIComponent(current)}`;
          // Redirect to landing login.
          if (DEBUG_ENTITLEMENTS) console.log("[EntitlementsContext] redirecting to login:", loginUrl);
          window.location.replace(loginUrl);
          return;
        }
      }
      if (msg === "missing_entitlement" || msg === "forbidden") {
        setForbidden(true);
        setError(msg);
      } else {
        setError(msg);
      }
    } finally {
      if (DEBUG_ENTITLEMENTS) console.log("[EntitlementsContext] refresh() finished");
      setLoading(false);
    }
  }, []);

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
