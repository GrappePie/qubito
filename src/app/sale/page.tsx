"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import SideSummarySale from "@/components/sale/sideSummarySale";
import SaleContainer from "@/components/sale/SaleContainer";
import PermissionGate from "@/components/PermissionGate";
import { useGetCashRegisterStatusQuery } from "@/store/slices/cashRegisterApi";
import { useAccounts } from "@/contexts/AccountsContext";

function SaleContent() {
    return (
        <div className="flex flex-row w-full h-full min-h-0">
            <div className="basis-2/3 p-0  overflow-hidden">
                <SaleContainer />
            </div>
            <div className="h-full basis-1/3 p-0">
                <SideSummarySale />
            </div>
        </div>
    );
}

function CashRegisterNotice() {
    const { data, isLoading, error, refetch } = useGetCashRegisterStatusQuery();
    const { hasPermission } = useAccounts();
    const canOpen = hasPermission("cash.close");

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verificando caja...
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center text-sm text-rose-600">
                No se pudo cargar el estado de caja.
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="ml-3 rounded bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (!data?.open) {
        return (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-amber-700">Caja cerrada</h2>
                        <p className="text-sm text-amber-700">
                            Puedes tomar ordenes, pero el cobro esta bloqueado.
                        </p>
                    </div>
                    {canOpen ? (
                        <Link
                            href="/cash-close"
                            className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            Ir a abrir caja
                        </Link>
                    ) : (
                        <p className="text-xs text-amber-700">
                            Solicita a un administrador que abra la caja.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return null;
}

export default function SalePage() {
    return (
        <PermissionGate permission="pos.use" redirectTo="/">
            <div className="flex h-full min-h-0 flex-col">
                <CashRegisterNotice />
                <div className="flex-1 min-h-0">
                    <SaleContent />
                </div>
            </div>
        </PermissionGate>
    );
}
