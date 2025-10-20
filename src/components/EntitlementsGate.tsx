"use client";
import React from "react";
import { useEntitlements } from "@/contexts/EntitlementsContext";

export default function EntitlementsGate({ children }: { children: React.ReactNode }) {
  const { loading, forbidden, error } = useEntitlements();

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
        Verificando acceso...
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold mb-2">Tu suscripción no habilita el POS</h2>
        <p className="text-sm text-gray-600 mb-4">
          Para continuar, actualiza tu plan en el sitio principal o cambia la selección de proyecto.
        </p>
        <div className="flex gap-3">
          <a
            className="px-3 py-2 bg-gray-900 text-white rounded"
            href={(process.env.NEXT_PUBLIC_ENTITLEMENTS_BASE_URL || process.env.ENTITLEMENTS_BASE_URL || "https://pixelgrimoire.com").replace(/\/$/, "") + "/pricing"}
            target="_blank" rel="noreferrer"
          >
            Ver planes
          </a>
          <button className="px-3 py-2 border rounded" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold mb-2">No pudimos validar tu acceso</h2>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <button className="px-3 py-2 border rounded" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

