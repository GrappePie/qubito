"use client";
import React, { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAccounts } from '@/contexts/AccountsContext';

export default function AccountGate({ children }: { children: React.ReactNode }) {
  const { loading, needsBootstrap, bootstrapAdmin, error, hasAdmin } = useAccounts();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (password.length < 8) {
      setLocalError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('La confirmacion de contrasena no coincide.');
      return;
    }
    setSubmitting(true);
    try {
      await bootstrapAdmin({ displayName, email, password });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLocalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Preparando tu cuenta...
      </div>
    );
  }

  if (needsBootstrap) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6 w-full max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="text-sky-600" />
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                Crea tu cuenta administrador
              </h2>
              <p className="text-sm text-slate-500">
                Necesitamos un admin por cliente para gestionar accesos y roles.
              </p>
            </div>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nombre para mostrar
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Ej. Admin principal"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Correo de contacto (opcional)
              </label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="admin@tu-negocio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Contrasena</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="mt-1 w-full rounded-lg border px-3 py-2 pr-24 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-sky-700 hover:underline"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Minimo 8 caracteres.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Confirmar contrasena
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {(localError || error) && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
                {localError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 text-white px-4 py-2 font-medium hover:bg-sky-700 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear administrador
            </button>
            {hasAdmin && (
              <p className="text-xs text-slate-500">
                Se detecto un admin, refresca la p\u00e1gina si ya lo configuraste en otra pesta\u00f1a.
              </p>
            )}
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
