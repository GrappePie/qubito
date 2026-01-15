"use client";

import React, { useMemo, useState } from "react";
import TitlePage from "@/components/common/TitlePage";
import PermissionGate from "@/components/PermissionGate";
import {
  useGetCashCloseSummaryQuery,
  type CashCloseTicket,
} from "@/store/slices/cashCloseApi";
import {
  useCloseCashRegisterMutation,
  useGetCashRegisterStatusQuery,
  useOpenCashRegisterMutation,
} from "@/store/slices/cashRegisterApi";
import { toast } from "react-hot-toast";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

const toCurrency = (value: number) => currencyFormatter.format(value);
const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, amount: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "-";
  return parsed.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const contextLabel = (context: CashCloseTicket["orderContext"]) =>
  context === "table" ? "Mesa" : "Rapida";

function CashCloseContent() {
  const today = new Date();
  const [fromDate, setFromDate] = useState(() => toDateInput(today));
  const [toDate, setToDate] = useState(() => toDateInput(today));
  const [openingAmount, setOpeningAmount] = useState(0);
  const [closingAmount, setClosingAmount] = useState(0);
  const [closingNotes, setClosingNotes] = useState("");

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch: refetchSummary,
  } = useGetCashCloseSummaryQuery(
    { from: fromDate, to: toDate },
    { skip: !fromDate || !toDate }
  );

  const {
    data: statusData,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useGetCashRegisterStatusQuery();
  const [openCashRegister, { isLoading: isOpening }] =
    useOpenCashRegisterMutation();
  const [closeCashRegister, { isLoading: isClosing }] =
    useCloseCashRegisterMutation();

  const totals = data?.totals;
  const tickets = data?.tickets ?? [];
  const isOpen = statusData?.open;
  const session = statusData?.session ?? null;
  const expectedCash =
    typeof statusData?.expectedCash === "number"
      ? statusData.expectedCash
      : null;
  const discrepancy =
    expectedCash == null ? null : roundCurrency(closingAmount - expectedCash);
  const needsReason = discrepancy != null && Math.abs(discrepancy) > 0.009;

  const quickRanges = useMemo(() => {
    const todayDate = new Date();
    const yesterday = addDays(todayDate, -1);
    const weekStart = addDays(todayDate, -6);
    const ranges = [
      { label: "Hoy", from: todayDate, to: todayDate },
      { label: "Ayer", from: yesterday, to: yesterday },
      { label: "Ultimos 7 dias", from: weekStart, to: todayDate },
    ];
    if (session?.openedAt) {
      const opened = new Date(session.openedAt);
      if (Number.isFinite(opened.getTime())) {
        ranges.unshift({ label: "Desde apertura", from: opened, to: todayDate });
      }
    }
    return ranges;
  }, [session?.openedAt]);

  const handleOpen = async () => {
    if (openingAmount < 0) {
      toast.error("El saldo inicial no puede ser negativo");
      return;
    }
    try {
      await openCashRegister({ openingAmount }).unwrap();
      toast.success("Caja abierta");
      refetchStatus();
      refetchSummary();
    } catch (err) {
      console.error("open cash register", err);
      toast.error("No se pudo abrir la caja");
    }
  };

  const handleClose = async () => {
    if (closingAmount < 0) {
      toast.error("El saldo de cierre no puede ser negativo");
      return;
    }
    if (needsReason && !closingNotes.trim()) {
      toast.error("Agrega un motivo para el descuadre");
      return;
    }
    try {
      await closeCashRegister({
        closingAmount,
        notes: closingNotes.trim() || undefined,
      }).unwrap();
      toast.success("Caja cerrada");
      refetchStatus();
      refetchSummary();
      setClosingNotes("");
    } catch (err) {
      console.error("close cash register", err);
      const apiError = err as { data?: { error?: string } };
      if (apiError?.data?.error === "closing_reason_required") {
        toast.error("Agrega un motivo para el descuadre");
        return;
      }
      toast.error("No se pudo cerrar la caja");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <TitlePage title="Corte de caja" subtitle="Resumen de ventas por rango de fechas." />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {statusLoading
                ? "Cargando estado..."
                : statusError
                  ? "Estado no disponible"
                  : isOpen
                    ? "Caja abierta"
                    : "Caja cerrada"}
            </h2>
            <p className="text-sm text-slate-500">
              {statusError
                ? "No pudimos validar el estado de la caja."
                : isOpen
                  ? "La caja esta habilitada para ventas."
                  : "No se pueden registrar ventas hasta abrir la caja."}
            </p>
            {session && (
              <div className="mt-2 text-xs text-slate-500">
                <span>Inicio: {formatDateTime(session.openedAt)}</span>
                <span className="ml-3">Saldo inicial: {toCurrency(session.openingAmount)}</span>
              </div>
            )}
            {expectedCash != null && (
              <div className="mt-2 text-xs text-slate-500">
                <span>Esperado en caja: {toCurrency(expectedCash)}</span>
                {discrepancy != null && (
                  <span className="ml-3">
                    Diferencia: {toCurrency(discrepancy)}
                  </span>
                )}
                {discrepancy != null && Math.abs(discrepancy) > 0.009 && (
                  <span className="ml-3 text-amber-700">
                    Hay un descuadre por registrar.
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            {statusError ? (
              <button
                type="button"
                onClick={() => refetchStatus()}
                className="h-10 rounded-lg bg-slate-200 px-4 font-semibold text-slate-700 hover:bg-slate-300"
              >
                Reintentar
              </button>
            ) : isOpen ? (
              <>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  Saldo de cierre
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={closingAmount}
                    onChange={(event) =>
                      setClosingAmount(Number(event.target.value) || 0)
                    }
                    className="h-10 rounded border border-slate-300 px-3"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600 sm:min-w-[260px]">
                  Motivo de descuadre
                  <input
                    type="text"
                    value={closingNotes}
                    onChange={(event) => setClosingNotes(event.target.value)}
                    placeholder="Explica la diferencia si aplica"
                    className="h-10 rounded border border-slate-300 px-3"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isClosing || statusLoading || (needsReason && !closingNotes.trim())}
                  className="h-10 rounded-lg bg-rose-600 px-4 font-semibold text-white transition-colors disabled:bg-slate-400"
                >
                  {isClosing ? "Cerrando..." : "Cerrar caja"}
                </button>
              </>
            ) : (
              <>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  Saldo inicial
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={openingAmount}
                    onChange={(event) =>
                      setOpeningAmount(Number(event.target.value) || 0)
                    }
                    className="h-10 rounded border border-slate-300 px-3"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleOpen}
                  disabled={isOpening || statusLoading}
                  className="h-10 rounded-lg bg-emerald-600 px-4 font-semibold text-white transition-colors disabled:bg-slate-400"
                >
                  {isOpening ? "Abriendo..." : "Abrir caja"}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Desde
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-10 rounded border border-slate-300 px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Hasta
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-10 rounded border border-slate-300 px-3"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {quickRanges.map((range) => (
                <button
                  key={range.label}
                  type="button"
                  onClick={() => {
                    setFromDate(toDateInput(range.from));
                    setToDate(toDateInput(range.to));
                  }}
                  className="h-9 rounded-full border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetchSummary()}
            disabled={isLoading || isFetching}
            className="h-10 rounded-lg bg-sky-600 px-4 font-semibold text-white transition-colors disabled:bg-slate-400"
          >
            {isFetching ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          No se pudo cargar el corte de caja. Revisa tu conexion e intenta de nuevo.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Ventas totales</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {totals ? toCurrency(totals.total) : "-"}
          </p>
          <p className="text-xs text-slate-500">
            {totals ? `${totals.tickets} tickets` : "Sin datos"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Cobros en efectivo</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {totals ? toCurrency(totals.cash) : "-"}
          </p>
          <p className="text-xs text-slate-500">
            {totals ? `${totals.items} productos` : "Sin datos"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Cobros con tarjeta</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {totals ? toCurrency(totals.card) : "-"}
          </p>
          <p className="text-xs text-slate-500">
            {totals ? `Propinas ${toCurrency(totals.tip)}` : "Sin datos"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Impuestos y cambio</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {totals ? toCurrency(totals.tax) : "-"}
          </p>
          <p className="text-xs text-slate-500">
            {totals ? `Cambio ${toCurrency(totals.change)}` : "Sin datos"}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Tickets del rango</h2>
          <span className="text-xs text-slate-500">
            {isLoading ? "Cargando..." : `${tickets.length} tickets`}
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Contexto</th>
                <th className="p-3 text-left">Mesa</th>
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3 text-left">Items</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Efectivo</th>
                <th className="p-3 text-left">Tarjeta</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="p-3" colSpan={8}>
                    Cargando corte de caja...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td className="p-3" colSpan={8}>
                    No hay ventas registradas en este rango.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t text-slate-700">
                    <td className="p-3">{formatDateTime(ticket.createdAt)}</td>
                    <td className="p-3">{contextLabel(ticket.orderContext)}</td>
                    <td className="p-3">{ticket.tableNumber ?? "-"}</td>
                    <td className="p-3">{ticket.customerName ?? "-"}</td>
                    <td className="p-3">{ticket.itemsCount}</td>
                    <td className="p-3 font-semibold text-slate-900">
                      {toCurrency(ticket.total)}
                    </td>
                    <td className="p-3">{toCurrency(ticket.payments.cash)}</td>
                    <td className="p-3">{toCurrency(ticket.payments.card)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function CashClosePage() {
  return (
    <PermissionGate permission="cash.close" redirectTo="/">
      <CashCloseContent />
    </PermissionGate>
  );
}
