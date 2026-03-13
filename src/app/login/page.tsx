"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Lock, Shield, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useEntitlements } from '@/contexts/EntitlementsContext';

type LoginForm = {
  userId: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { data: ent, forbidden, refresh: refreshEntitlements } = useEntitlements();
  const TENANT_ID_REGEX = /^[A-Za-z0-9._-]{3,128}$/;
  const normalizeTenantId = (val?: string | null) => {
    const v = (val || '').trim();
    return v && TENANT_ID_REGEX.test(v) ? v : '';
  };
  const [loginForm, setLoginForm] = useState<LoginForm>({
    userId: '',
    password: '',
  });
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  const entitlementsBase = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_ENTITLEMENTS_BASE_URL ||
        process.env.ENTITLEMENTS_BASE_URL ||
        'https://pixelgrimoire.com'
      ).replace(/\/$/, ''),
    []
  );
  const allowLocalDevLogin = useMemo(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_LOGIN === 'true') return true;
    if (typeof window === 'undefined') return false;
    return /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
  }, []);
  const isLocalBypass = ent?.iss === 'localhost';

  const tenantFromEntitlements = useMemo(
    () => normalizeTenantId(ent?.tenantId ?? ent?.customerId),
    [ent?.customerId, ent?.tenantId]
  );
  const tenantFromQuery = useMemo(() => normalizeTenantId(search?.get('tenantId')), [search]);
  const tenantFromStorage = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      return normalizeTenantId(window.localStorage.getItem('qubito_tenant'));
    } catch {
      return '';
    }
  }, []);
  const tenantId =
    tenantFromEntitlements ||
    tenantFromQuery ||
    tenantFromStorage ||
    normalizeTenantId(process.env.NEXT_PUBLIC_DEFAULT_TENANT || '');
  const showLocalLogin = Boolean(tenantId) && (hasAdmin === true || allowLocalDevLogin);

  const checkAdmin = async (tenantId: string) => {
    if (!tenantId) return;
    setCheckingAdmin(true);
    try {
      const res = await fetch(`/api/accounts/bootstrap?tenantId=${encodeURIComponent(tenantId)}`);
      if (!res.ok) {
        setHasAdmin(null);
        return;
      }
      const data = await res.json();
      setHasAdmin(Boolean(data.hasAdmin));
    } catch {
      setHasAdmin(null);
    } finally {
      setCheckingAdmin(false);
    }
  };

  useEffect(() => {
    if (!tenantId) return;
    const timer = setTimeout(() => checkAdmin(tenantId), 200);
    return () => clearTimeout(timer);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantFromQuery) return;
    try {
      window.localStorage.setItem('qubito_tenant', tenantFromQuery);
    } catch {}
  }, [tenantFromQuery]);

  useEffect(() => {
    if (!ent?.ok || isLocalBypass) return;
    if (checkingAdmin || hasAdmin === null) return;

    const next = search?.get('next');

    // Only bypass the login screen when Qubito already has a local session.
    if (ent.iss === 'qubito') {
      router.replace(next || '/');
    }
  }, [checkingAdmin, ent?.iss, ent?.ok, hasAdmin, isLocalBypass, router, search]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId.trim()) {
      toast.error('No se pudo obtener tu tenant, recarga e intenta de nuevo.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': tenantId.trim() },
        body: JSON.stringify(loginForm),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error === 'invalid_credentials' ? 'Credenciales inválidas' : 'No se pudo iniciar sesión';
        toast.error(msg);
        return;
      }
      const data = await res.json();
      const acc = data.account;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('qubito_tenant', acc.tenantId);
        window.localStorage.setItem('qubito_sub', acc.userId);
      }
      // Refresca entitlements/contexto para que Navbar y permisos carguen sin recargar página
      await refreshEntitlements().catch(() => {});
      toast.success('Sesión iniciada');
      const next = search?.get('next');
      router.replace(next || '/');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSsoLogin = async () => {
    setSsoLoading(true);
    handleOpenPixelGrimoire();
  };

  const handleOpenPixelGrimoire = () => {
    if (typeof window === 'undefined') return;
    const redirect = encodeURIComponent(window.location.origin);
    window.location.replace(`${entitlementsBase}/sign-in?redirect=${redirect}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg w-full max-w-2xl grid md:grid-cols-2 overflow-hidden">
        <div className="bg-slate-900 text-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-300">
              <Shield className="h-6 w-6" />
              <p className="text-sm uppercase tracking-wide">Qubito Access</p>
            </div>
            <h2 className="text-2xl font-bold mt-2">Accede a tu cuenta interna</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {forbidden && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              Tu suscripcion no habilita Qubito. Regresa a Pixel Grimoire para gestionar tus proyectos.
              <div className="mt-2">
                <a className="text-sky-600 underline" href={entitlementsBase}>
                  Ir a Pixel Grimoire
                </a>
              </div>
            </div>
          )}

          {showLocalLogin && (
            <div className="space-y-4">
              <div>
                <p className="text-base font-semibold text-slate-800">
                  Acceso local
                </p>
                <p className="text-sm text-slate-500">
                  Usa el usuario local que configuraste desde la seccion de usuarios.
                </p>
              </div>
              <form className="space-y-3" onSubmit={handleLogin}>
                <div>
                  <label className="text-sm text-slate-700 flex items-center gap-1">
                    <User className="h-4 w-4" /> Usuario
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={loginForm.userId}
                    onChange={(e) => setLoginForm((f) => ({ ...f, userId: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-700 flex items-center gap-1">
                    <Lock className="h-4 w-4" /> Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      className="mt-1 w-full rounded-lg border px-3 py-2 pr-24 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-sky-700 hover:underline"
                      onClick={() => setShowLoginPassword((v) => !v)}
                    >
                      {showLoginPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 text-white px-4 py-2 font-semibold hover:bg-sky-700 disabled:opacity-60"
                >
                  <LogIn className="h-4 w-4" />
                  Entrar
                </button>
                {checkingAdmin && <p className="text-xs text-slate-500">Revisando tenant...</p>}
              </form>
            </div>
          )}

          <div className={`${showLocalLogin ? 'pt-4 border-t border-slate-200' : ''} space-y-4`}>
            <div>
              <p className="text-lg font-semibold text-slate-800">
                {showLocalLogin ? 'Entrar con Pixel Grimoire' : 'Continuar con Pixel Grimoire'}
              </p>
              <p className="text-sm text-slate-500">
                {showLocalLogin
                  ? 'Usa Pixel Grimoire para enlazar o recuperar acceso al tenant.'
                  : 'La primera vez se crea automaticamente tu administrador desde esta sesion.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSsoLogin}
              disabled={ssoLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {ssoLoading ? 'Conectando...' : 'Continuar con Pixel Grimoire'}
            </button>
            <button
              type="button"
              onClick={handleOpenPixelGrimoire}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ir a iniciar sesion
            </button>
            <p className="text-xs text-slate-500">
              Si ya tienes sesion iniciada en Pixel Grimoire, se conectara automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
