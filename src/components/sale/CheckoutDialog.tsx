"use client";

import React, {useEffect, useMemo, useState} from "react";
import {Dialog} from "@/components/material-components/Dialog";
import type {CheckoutSummary, PaymentDraft, PaymentMethod} from "@/types/checkout";
import {PaymentRow} from "@/components/sale/PaymentRow";

interface CheckoutDialogProps {
    open: boolean;
    subtotal: number;
    tax: number;
    total: number;
    cashOpen?: boolean;
  cashStatusLoading?: boolean;onClose: () => void;
    onComplete: (summary: CheckoutSummary) => Promise<void> | void;
}

const QUICK_TIPS = [10, 15, 20] as const;

const toCurrency = (value: number) => value.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
});

const sanitizeNonNegativeNumber = (value: string) => {
    const trimmed = value.replace(/,/g, ".");
    if (trimmed === "") return "" as const;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? trimmed : "0";
};

const roundCurrency = (value: number | string) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
];

const createPaymentDraft = (overrides?: Partial<PaymentDraft>): PaymentDraft => ({
  id: crypto.randomUUID(),
  method: "cash",
  amountInput: "",
  ...overrides,
});

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
                                                           open,
                                                           subtotal,
                                                           tax,
                                                           total,
                                                           cashOpen,
  cashStatusLoading,onClose,
                                                           onComplete,
                                                       }) => {
    const [payments, setPayments] = useState<PaymentDraft[]>([createPaymentDraft({ method: "cash" })]);
    const [tipPreset, setTipPreset] = useState<number | null>(null);
    const [customTip, setCustomTip] = useState<string>("0");
    const [splitCount, setSplitCount] = useState<string>("1");
    const [customerName, setCustomerName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            setPayments([createPaymentDraft({ method: "cash" })]);
            setTipPreset(null);
            setCustomTip("0");
            setSplitCount("1");
            setCustomerName("");
        }
    }, [open]);

    const tipFromPreset = useMemo(() => {
        if (tipPreset == null) return 0;
        return roundCurrency(subtotal * (tipPreset / 100));
    }, [tipPreset, subtotal]);

    const numericCustomTip = Number(customTip || 0);
    const tipAmount = roundCurrency(tipPreset == null ? numericCustomTip : tipFromPreset);
    const totalDue = roundCurrency(total + tipAmount);

    const paymentsNumeric = payments.map((p) => roundCurrency(Number(p.amountInput || 0)));
    const paid = roundCurrency(paymentsNumeric.reduce((sum, v) => sum + v, 0));
    const remaining = Math.max(0, roundCurrency(totalDue - paid));
    const change = remaining > 0 ? 0 : roundCurrency(paid - totalDue);

    const numericSplitCount = Math.max(1, Math.trunc(Number(splitCount) || 1));

    const hasCashPayment = payments.some((p) => p.method === "cash" && Number(p.amountInput || 0) > 0);
    const cashClosed = cashOpen === false;
    const cashUnknown = cashStatusLoading === true;
    const cashBlocked = hasCashPayment && (cashClosed || cashUnknown);

    const canFinalize = !cashBlocked && Number(paid) + 0.0001 >= Number(totalDue);

    const handlePaymentChange = (id: string, patch: { method?: PaymentMethod; amountInput?: string }) => {
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    };

    const handleAddPayment = () => {
      const newPayment = createPaymentDraft({ method: "card" });
      setPayments((prev) => [...prev, newPayment]);
    };

    const handleRemovePayment = (id: string) => {
      setPayments((prev) => {
        if (prev.length <= 1) {
          // si es la única fila, solo limpiamos el monto
          return prev.map((p) => (p.id === id ? { ...p, amountInput: "" } : p));
        }
        return prev.filter((p) => p.id !== id);
      });
    };

    const handleFinalize = async () => {
        if (!canFinalize || isSubmitting) return;
        try {
            setIsSubmitting(true);

            const paymentsNormalized = payments.map((p) => ({
                id: p.id,
                method: p.method,
                amount: roundCurrency(Number(p.amountInput || 0)),
            }));

            const cashPaid = paymentsNormalized
                .filter((p) => p.method === "cash")
                .reduce((sum, p) => sum + p.amount, 0);
            const cardPaid = paymentsNormalized
                .filter((p) => p.method === "card")
                .reduce((sum, p) => sum + p.amount, 0);

            await onComplete({
                cash: roundCurrency(cashPaid),
                card: roundCurrency(cardPaid),
                tip: tipAmount,
                paid,
                change,
                totalDue,
                customerName: customerName.trim() || undefined,
                splitCount: numericSplitCount > 1 ? numericSplitCount : undefined,
                tipType: tipPreset == null ? "custom" : "percentage",
                tipPercentage: tipPreset == null ? undefined : tipPreset,
                payments: paymentsNormalized,
            } as CheckoutSummary);
            onClose();
        } catch {
            // se maneja el error en el padre (toast)
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
      open={open}
      handler={onClose}
      title={"Registrar pago"}
      subtitle={"Captura los montos cobrados y confirma la venta para generar el ticket."}
    >
      <div className="flex flex-col gap-4">
        {cashStatusLoading && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Verificando estado de caja...
          </div>
        )}
        {cashClosed && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Caja cerrada. Abre la caja para cobrar esta venta.
          </div>
        )}
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
                    setCustomTip("0");
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
                                                                        setCustomTip((prev) => (Number(prev) < 0 ? "0" : prev));
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

        <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Formas de pago</h3>
          <button
            type="button"
            onClick={handleAddPayment}
            className="text-xs font-medium text-sky-700 hover:underline"
          >
            Agregar forma de pago
          </button>
        </div>

        <div className="space-y-2">
          {payments.map((payment, index) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              methods={PAYMENT_METHODS}
              canRemove={payments.length > 1}
              autoFocusAmount={index === payments.length - 1}
              onChange={handlePaymentChange}
              onRemove={handleRemovePayment}
            />
          ))}
        </div>

        {remaining > 0 && (
          <p className="text-xs text-rose-600">
            Te faltan {toCurrency(remaining)} por cobrar. Agrega otra forma de pago o ajusta los montos.
          </p>
        )}
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
            {isSubmitting
              ? "Procesando..."
              : cashUnknown
                ? "Verificando caja..."
                : cashClosed
                  ? "Caja cerrada"
                  : "Finalizar venta"}
          </button>
        </footer>
      </div>
    </Dialog>
  );
};

export default CheckoutDialog;
