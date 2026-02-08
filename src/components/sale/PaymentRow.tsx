"use client";

import React, {useEffect, useRef} from "react";
import type {PaymentDraft, PaymentMethod} from "@/types/checkout";

export interface PaymentRowProps {
  payment: PaymentDraft;
  methods: { value: PaymentMethod; label: string }[];
  canRemove: boolean;
  autoFocusAmount?: boolean;
  onChange: (id: string, patch: { method?: PaymentMethod; amountInput?: string }) => void;
  onRemove: (id: string) => void;
}

const numericPattern = /^\d*(?:[.,]\d*)?$/;

const sanitizeNonNegativeNumber = (value: string): string => {
  if (!numericPattern.test(value)) return "";
  const trimmed = value.replace(/,/g, ".");
  if (trimmed === "") return "";
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return "";
  return trimmed;
};

export const PaymentRow: React.FC<PaymentRowProps> = ({
  payment,
  methods,
  canRemove,
  autoFocusAmount,
  onChange,
  onRemove,
}) => {
  const amountRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocusAmount && amountRef.current) {
      amountRef.current.focus();
      amountRef.current.select();
    }
  }, [autoFocusAmount]);

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-10 rounded border border-slate-300 bg-white px-2 text-sm text-slate-700"
        value={payment.method}
        onChange={(e) => onChange(payment.id, { method: e.target.value as PaymentMethod })}
      >
        {methods.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      <input
        ref={amountRef}
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        className="h-10 flex-1 rounded border border-slate-300 px-3 text-right text-sm"
        placeholder="0.00"
        value={payment.amountInput}
        onChange={(e) => {
          const raw = e.target.value;
          const next = sanitizeNonNegativeNumber(raw);
          if (next === "" && raw !== "") return; // ignora caracteres inválidos como 'e'
          onChange(payment.id, { amountInput: next });
        }}
      />

      <button
        type="button"
        onClick={() => onRemove(payment.id)}
        disabled={!canRemove}
        className="h-8 rounded border border-slate-300 px-2 text-xs font-medium text-slate-600 disabled:opacity-40"
      >
        Quitar
      </button>
    </div>
  );
};

export default PaymentRow;

