"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useEntitlements } from '@/contexts/EntitlementsContext';
import {
  PERMISSION_CATALOG,
  PermissionCode,
  PermissionDef,
} from '@/lib/permissions';

export type AccountInfo = {
  id: string;
  tenantId: string;
  userId: string;
  displayName: string | null;
  email: string | null;
  roleId: string | null;
  roleName: string | null;
  isAdmin: boolean;
  permissions: PermissionCode[];
};

type AccountsState = {
  loading: boolean;
  hasAdmin: boolean;
  needsBootstrap: boolean;
  account: AccountInfo | null;
  permissions: PermissionCode[];
  availablePermissions: PermissionDef[];
  error: string | null;
  refresh: () => Promise<void>;
  bootstrapAdmin: (payload: { displayName?: string; email?: string; password?: string }) => Promise<void>;
  hasPermission: (code: PermissionCode | string) => boolean;
  hasAnyPermission: (codes: Array<PermissionCode | string>) => boolean;
};

const AccountsContext = createContext<AccountsState | null>(null);

type BootstrapResponse = {
  tenantId: string;
  hasAdmin: boolean;
  needsBootstrap: boolean;
  currentAccount: AccountInfo | null;
  availablePermissions: PermissionDef[];
};

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const { data: entitlementData, loading: entLoading, error: entError } = useEntitlements();
  const [loading, setLoading] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [availablePermissions, setAvailablePermissions] =
    useState<PermissionDef[]>(PERMISSION_CATALOG);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = useCallback(
    (code: PermissionCode | string) => {
      if (!code) return false;
      if (account?.isAdmin) return true;
      return (account?.permissions ?? []).includes(code as PermissionCode);
    },
    [account]
  );

  const hasAnyPermission = useCallback(
    (codes: Array<PermissionCode | string>) => {
      if (account?.isAdmin) return true;
      const perms = account?.permissions ?? [];
      return codes.some((c) => perms.includes(c as PermissionCode));
    },
    [account]
  );

  const buildHeaders = useCallback(() => {
    const headers = new Headers({ 'content-type': 'application/json' });
    if (!entitlementData) return headers;
    const tenant = entitlementData.customerId ?? entitlementData.sub;
    const sub = entitlementData.sub;
    if (tenant) headers.set('x-tenant-id', tenant);
    if (sub) headers.set('x-user-sub', sub);
    return headers;
  }, [entitlementData]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Prefer local session
    try {
      const me = await fetch('/api/auth/me', { credentials: 'include' });
      if (me.ok) {
        const data = await me.json();
        const acc = data.account as AccountInfo;
        const tenant = acc.tenantId;
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('qubito_tenant', tenant);
            window.localStorage.setItem('qubito_sub', acc.userId);
          }
        } catch {}
        setAccount(acc);
        setHasAdmin(true);
        setNeedsBootstrap(false);
        setAvailablePermissions(PERMISSION_CATALOG);
        setLoading(false);
        return;
      }
    } catch {}

    if (!entitlementData || entError) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/accounts/bootstrap', {
        method: 'GET',
        headers: buildHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `bootstrap_error_${res.status}`);
      }
      const data = (await res.json()) as BootstrapResponse;
      setHasAdmin(Boolean(data.hasAdmin));
      setNeedsBootstrap(Boolean(data.needsBootstrap));
      setAccount(data.currentAccount ?? null);
      setAvailablePermissions(
        Array.isArray(data.availablePermissions) && data.availablePermissions.length
          ? data.availablePermissions
          : PERMISSION_CATALOG
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [buildHeaders, entError, entitlementData]);

  const bootstrapAdmin = useCallback(
    async (payload: { displayName?: string; email?: string; password?: string }) => {
      if (!entitlementData) throw new Error('missing_entitlements');
      setError(null);
      const res = await fetch('/api/accounts/bootstrap', {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `bootstrap_error_${res.status}`);
      }
      await refresh();
    },
    [buildHeaders, entitlementData, refresh]
  );

  useEffect(() => {
    if (entLoading) return;
    if (entError) {
      setError(entError);
      setLoading(false);
      return;
    }
    refresh().catch(() => {});
  }, [entLoading, entError, refresh]);

  const value = useMemo<AccountsState>(
    () => ({
      loading,
      hasAdmin,
      needsBootstrap,
      account,
      permissions: account?.permissions ?? [],
      availablePermissions,
      error,
      refresh,
      bootstrapAdmin,
      hasPermission,
      hasAnyPermission,
    }),
    [
      account,
      availablePermissions,
      bootstrapAdmin,
      error,
      hasAnyPermission,
      hasPermission,
      hasAdmin,
      loading,
      needsBootstrap,
      refresh,
    ]
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useAccounts must be used within AccountsProvider');
  return ctx;
}
