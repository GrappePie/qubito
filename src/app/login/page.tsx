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

type BootstrapForm = {
  userId: string;
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { data: ent, forbidden, refresh: refreshEntitlements } = useEntitlements();
  const [loginForm, setLoginForm] = useState<LoginForm>({
    userId: '',
    password: '',
  });
  const [bootForm, setBootForm] = useState<BootstrapForm>({
    userId: '',
    displayName: 'Administrador',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showBootstrapPassword, setShowBootstrapPassword] = useState(false);

  const tenantFromEntitlements = useMemo(
    () => ent?.customerId || process.env.NEXT_PUBLIC_DEFAULT_TENANT || process.env.DEFAULT_TENANT_ID || '',
    [ent?.customerId]
  );
  const tenantId = tenantFromEntitlements;

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
    if (!tenantFromEntitlements) return;
    const timer = setTimeout(() => checkAdmin(tenantFromEntitlements), 200);
    return () => clearTimeout(timer);
  }, [tenantFromEntitlements]);

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

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId.trim()) {
      toast.error('No se pudo obtener tu tenant, recarga e intenta de nuevo.');
      return;
    }
    if (bootForm.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (bootForm.password !== bootForm.confirmPassword) {
      toast.error('La confirmación de contraseña no coincide');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/accounts/bootstrap', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': tenantId.trim() },
        body: JSON.stringify(bootForm),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error || 'No se pudo crear el admin';
        toast.error(msg);
        return;
      }
      toast.success('Administrador creado, iniciando sesión...');
      setLoginForm({
        userId: bootForm.userId,
        password: bootForm.password,
      });
      await handleLogin(e);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo crear el admin');
    } finally {
      setSubmitting(false);
    }
  };

  const showBootstrap = hasAdmin === false;

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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-800">
                {showBootstrap ? 'Crear administrador' : 'Iniciar sesión'}
              </p>
              <p className="text-sm text-slate-500">
                {showBootstrap ? 'Primer admin con contraseña' : 'Accede a tu tenant interno'}
              </p>
            </div>
          </div>

          {forbidden && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              Tu suscripción no habilita Qubito. Regresa a pixelgrimoire.com para gestionar tus proyectos.
              <div className="mt-2">
                <a
                  className="text-sky-600 underline"
                  href={(process.env.NEXT_PUBLIC_ENTITLEMENTS_BASE_URL || process.env.ENTITLEMENTS_BASE_URL || 'https://pixelgrimoire.com').replace(/\/$/, '')}
                >
                  Ir a pixelgrimoire.com
                </a>
              </div>
            </div>
          )}

          {!showBootstrap ? (
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
          ) : (
            <form className="space-y-3" onSubmit={handleBootstrap}>
              <div>
                <label className="text-sm text-slate-700">Usuario</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={bootForm.userId}
                  onChange={(e) => setBootForm((f) => ({ ...f, userId: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">Nombre</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={bootForm.displayName}
                  onChange={(e) => setBootForm((f) => ({ ...f, displayName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">Email (opcional)</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={bootForm.email}
                  onChange={(e) => setBootForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">Contraseña</label>
                <div className="relative">
                  <input
                    type={showBootstrapPassword ? 'text' : 'password'}
                    className="mt-1 w-full rounded-lg border px-3 py-2 pr-24 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={bootForm.password}
                    onChange={(e) => setBootForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-sky-700 hover:underline"
                    onClick={() => setShowBootstrapPassword((v) => !v)}
                  >
                    {showBootstrapPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Mínimo 8 caracteres. Usa letras y números.</p>
              </div>
              <div>
                <label className="text-sm text-slate-700">Confirmar contraseña</label>
                <input
                  type={showBootstrapPassword ? 'text' : 'password'}
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={bootForm.confirmPassword}
                  onChange={(e) => setBootForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                Crear administrador
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
