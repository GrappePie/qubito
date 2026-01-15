"use client";

import React, {useEffect, useMemo, useState} from "react";
import {Dialog} from "@/components/material-components/Dialog";
import type {CheckoutSummary} from "@/types/checkout";

interface CheckoutDialogProps {
    open: boolean;
    subtotal: number;
    tax: number;
    total: number;
    onClose: () => void;
    onComplete: (summary: CheckoutSummary) => Promise<void> | void;
}

const QUICK_TIPS = [10, 15, 20] as const;

const toCurrency = (value: number) => value.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
});

const sanitizeNonNegativeNumber = (value: string) => {
    const parsed = Number(value.replace(/,/g, "."));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const roundCurrency = (value: number | string) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
                                                           open,
                                                           subtotal,
                                                           tax,
                                                           total,
                                                           onClose,
                                                           onComplete,
                                                       }) => {
    const [cash, setCash] = useState(0);
    const [card, setCard] = useState(0);
    const [tipPreset, setTipPreset] = useState<number | null>(null);
    const [customTip, setCustomTip] = useState(0);
    const [splitCount, setSplitCount] = useState(1);
    const [customerName, setCustomerName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            setCash(0);
            setCard(0);
            setTipPreset(null);
            setCustomTip(0);
            setSplitCount(1);
            setCustomerName("");
        }
    }, [open]);

    const tipFromPreset = useMemo(() => {
        if (tipPreset == null) return 0;
        return roundCurrency(subtotal * (tipPreset / 100));
    }, [tipPreset, subtotal]);

    const tipAmount = roundCurrency(tipPreset == null ? customTip : tipFromPreset);
    const totalDue = roundCurrency(total + tipAmount);
    const paid = roundCurrency(cash + card);
    const remaining = Math.max(0, roundCurrency(totalDue - paid));
    const change = remaining > 0 ? 0 : roundCurrency(paid - totalDue);
    const perPerson = splitCount > 1 ? totalDue / splitCount : null;
    const canFinalize = paid + 0.0001 >= totalDue;

    const handleFinalize = async () => {
        if (!canFinalize || isSubmitting) return;
        try {
            setIsSubmitting(true);
            await onComplete({
                cash: roundCurrency(cash),
                card: roundCurrency(card),
                tip: tipAmount,
                paid,
                change,
                totalDue,
                customerName: customerName.trim() || undefined,
                splitCount: splitCount > 1 ? splitCount : undefined,
                tipType: tipPreset == null ? "custom" : "percentage",
                tipPercentage: tipPreset == null ? undefined : tipPreset,
            });
            onClose();
        } catch {
            // se maneja el error en el padre (toast)
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} handler={onClose}
                title={"Registrar pago"}
                subtitle={"Captura los montos cobrados y confirma la venta para generar el ticket."}>
            <div className="flex flex-col gap-4">
                <section className="grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{toCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Impuesto</span>
                        <span>{toCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                        <span>Propina</span>
                        <span>{toCurrency(tipAmount)}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold text-slate-900">
                        <span>Total a pagar</span>
                        <span>{toCurrency(totalDue)}</span>
                    </div>
                </section>

                <section className="space-y-3">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700">Propina</h3>
                        <div className="mt-2 flex flex-wrap gap-2 items-center">
                            {QUICK_TIPS.map((pct) => (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => {
                                        setTipPreset(pct);
                                        setCustomTip(0);
                                    }}
                                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                                        tipPreset === pct
                                            ? "bg-emerald-600 text-white"
                                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                    }`}
                                    aria-pressed={tipPreset === pct}
                                >
                                    {pct}%
                                </button>
                            ))}
                            {/* Botón que activa el modo de propina personalizada */}
                            <button
                                type="button"
                                onClick={() => {
                                    setTipPreset(null);
                                    // si está en 0, mantenlo en 0 para representar "sin propina personalizada"
                                    setCustomTip((prev) => (prev < 0 ? 0 : prev));
                                    const input = document.getElementById("custom-tip-input");
                                    if (input) {
                                        input.focus();
                                    }
                                }}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors h-7 border ml-1 focus:outline-none focus:ring-2 focus:ring-sky-400/50 ${
                                    tipPreset === null
                                        ? "bg-sky-600 text-white border-sky-600"
                                        : "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
                                }`}
                                aria-pressed={tipPreset === null}
                            >
                                Otro
                            </button>
                            {/* Input pequeño para escribir la propina personalizada */}
                            <input
                                id="custom-tip-input"
                                type="number"
                                min={0}
                                value={tipPreset == null ? customTip : ""}
                                onChange={(event) => {
                                    setTipPreset(null);
                                    setCustomTip(sanitizeNonNegativeNumber(event.target.value));
                                }}
                                placeholder="0"
                                className={`rounded-full px-2 py-1 text-xs font-medium transition-colors h-7 w-40 border text-center focus:outline-none focus:ring-2 focus:ring-sky-400/50 ${
                                    tipPreset == null ? "bg-sky-50 text-sky-700 border-sky-400" : "bg-slate-50 text-slate-600 border-slate-200"
                                }`}
                                disabled={tipPreset != null}
                                aria-label="Propina personalizada"
                            />
                        </div>
                        <div className="mt-1">
                            <p className="text-xs text-slate-500">
                                Selecciona un porcentaje o usa &quot;Otro&quot; para capturar una propina personalizada.
                                Si dejas el campo en 0, no se agregará propina.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                        Cobro en efectivo
                        <input
                            type="number"
                            min={0}
                            value={cash}
                            onChange={(event) => setCash(sanitizeNonNegativeNumber(event.target.value))}
                            className="h-10 rounded border border-slate-300 px-3"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                        Cobro con tarjeta
                        <input
                            type="number"
                            min={0}
                            value={card}
                            onChange={(event) => setCard(sanitizeNonNegativeNumber(event.target.value))}
                            className="h-10 rounded border border-slate-300 px-3"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
                        Cliente (opcional)
                        <input
                            type="text"
                            value={customerName}
                            onChange={(event) => setCustomerName(event.target.value)}
                            placeholder="Nombre o folio del cliente"
                            className="h-10 rounded border border-slate-300 px-3"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
                        Dividir cuenta
                        <input
                            type="number"
                            min={1}
                            value={splitCount}
                            onChange={(event) => setSplitCount(Math.max(1, Math.trunc(Number(event.target.value) || 1)))}
                            className="h-10 rounded border border-slate-300 px-3"
                        />
                        {perPerson && (
                            <span className="text-xs text-slate-500">Cada persona paga {toCurrency(perPerson)}</span>
                        )}
                    </label>
                </section>

                <section className="space-y-1 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="flex justify-between">
                        <span>Total cobrado</span>
                        <span>{toCurrency(paid)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Restante</span>
                        <span
                            className={remaining > 0 ? "text-rose-600" : "text-emerald-600"}>{toCurrency(remaining)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Cambio</span>
                        <span>{toCurrency(change)}</span>
                    </div>
                </section>

                <footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 rounded-lg border border-slate-300 px-4 font-semibold text-slate-600 hover:bg-slate-100"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={!canFinalize || isSubmitting}
                        onClick={handleFinalize}
                        className="h-11 rounded-lg bg-sky-600 px-4 font-semibold text-white transition-colors disabled:bg-slate-400 disabled:text-slate-200"
                        aria-busy={isSubmitting}
                    >
                        {isSubmitting ? "Procesando..." : "Finalizar venta"}
                    </button>
                </footer>
            </div>
        </Dialog>
    );
};

export default CheckoutDialog;
