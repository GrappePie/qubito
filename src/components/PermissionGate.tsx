"use client";

import React, { useEffect, useMemo, useRef } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccounts } from '@/contexts/AccountsContext';

type Props = {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
};

export default function PermissionGate({ permission, children, fallback, redirectTo }: Props) {
  const { loading, hasAnyPermission } = useAccounts();
  const router = useRouter();
  const didRedirect = useRef(false);
  const required = useMemo(() => (Array.isArray(permission) ? permission : [permission]), [permission]);
  const allowed = hasAnyPermission(required);

  useEffect(() => {
    if (!allowed && redirectTo && !didRedirect.current) {
      didRedirect.current = true;
      router.replace(redirectTo);
    }
  }, [allowed, redirectTo, router]);

  let content: React.ReactNode = children;
  if (loading) {
    content = (
      <div className="w-full h-full flex items-center justify-center text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Verificando permisos...
      </div>
    );
  } else if (!allowed) {
    content =
      fallback || (
        <div className="p-6 max-w-xl mx-auto text-center border rounded-xl bg-slate-50">
          <div className="flex justify-center mb-3">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">No tienes acceso a esta sección</h2>
          <p className="text-sm text-slate-600">
            Solicita al administrador que te asigne un rol con los permisos necesarios.
          </p>
        </div>
      );
  }

  return <>{content}</>;
}
