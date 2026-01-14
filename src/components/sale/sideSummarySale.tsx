"use client";
import { useMemo, useState } from "react";
import CartItemRow from "@/components/sale/CartItemRow";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectActiveTableId, selectCartItems, selectIsQuickOrder, selectSubtotal, clearActiveTableCart } from "@/store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import CheckoutDialog from "@/components/sale/CheckoutDialog";
import { useCheckoutOrderMutation, useDeleteOrderMutation, useSaveOrderMutation } from "@/store/slices/ordersApi";
import { useGetCashRegisterStatusQuery } from "@/store/slices/cashRegisterApi";
import type { CheckoutSummary } from "@/types/checkout";

const TAX_RATE = 0.16;

const isCashClosedError = (error: unknown) => {
    if (!error || typeof error !== "object") return false;
    const maybe = error as { data?: { error?: string } };
    return maybe?.data?.error === "cash_closed";
};

const SideSummarySale = () => {
    const dispatch = useAppDispatch();
    const items = useAppSelector(selectCartItems);
    const inclusiveTotal = useAppSelector(selectSubtotal);
    const activeTableId = useAppSelector(selectActiveTableId);
    const isQuick = useAppSelector(selectIsQuickOrder);
    const router = useRouter();
    const [paymentOpen, setPaymentOpen] = useState(false);

    const [saveOrder, { isLoading: isSaving }] = useSaveOrderMutation();
    const [checkoutOrder, { isLoading: isFinalizing }] = useCheckoutOrderMutation();
    const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();
    const { data: cashStatus, isLoading: cashLoading } = useGetCashRegisterStatusQuery();

    const contextId = isQuick ? "quick" : activeTableId != null ? `mesa-${activeTableId}` : null;
    const mode = isQuick ? "quick" : "table";

    const orderItemsPayload = useMemo(
        () =>
            items.map((item) => ({
                productId: item.id,
                name: item.title,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                sku: item.sku,
                stock: item.stock,
            })),
        [items],
    );

    const netSubtotal = Number((inclusiveTotal / (1 + TAX_RATE)).toFixed(2));
    const total = Number(inclusiveTotal.toFixed(2));
    const tax = Number((total - netSubtotal).toFixed(2));
    const orderLabel = isQuick ? "Orden Rápida" : `Mesa #${activeTableId}`;
    const totalItems = useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items]);
    const canCheckout = Boolean(cashStatus?.open) && !cashLoading;

    const handleClear = async () => {
        if (items.length === 0) return;
        try {
            if (contextId) {
                await deleteOrder(contextId).unwrap();
            }
            dispatch(clearActiveTableCart());
            toast.success("Carrito vacío", { id: "clear-cart" });
        } catch (error) {
            console.error("clear order", error);
            toast.error("No pudimos eliminar la orden guardada");
        }
    };

    const handleSaveOrder = async () => {
        if (items.length === 0) {
            toast.error("Agrega productos antes de guardar");
            return;
        }
        if (!contextId) {
            toast.error("Selecciona una mesa válida antes de guardar");
            return;
        }
        try {
            await saveOrder({
                contextId,
                mode,
                tableNumber: mode === "table" ? activeTableId ?? null : null,
                items: orderItemsPayload,
                subtotal: netSubtotal,
                tax,
                total,
            }).unwrap();
            toast.success(`${orderLabel} guardada`);
            if (!isQuick) {
                router.push("/tables");
            }
        } catch (error) {
            console.error("save order", error);
            if (isCashClosedError(error)) {
                toast.error("Caja cerrada. Abre la caja para vender.");
                return;
            }
            toast.error("No pudimos guardar la orden");
        }
    };

    const handlePaymentComplete = async (summary: CheckoutSummary) => {
        if (!canCheckout) {
            toast.error("Caja cerrada. Abre la caja para cobrar.");
            throw new Error("cash-closed");
        }
        if (items.length === 0) {
            toast.error("No hay productos en la orden");
            throw new Error("empty-order");
        }
        if (!contextId) {
            toast.error("Selecciona una mesa válida antes de cobrar");
            throw new Error("missing-context");
        }
        try {
            await checkoutOrder({
                contextId,
                mode,
                tableNumber: mode === "table" ? activeTableId ?? null : null,
                items: orderItemsPayload,
                amounts: {
                    subtotal: netSubtotal,
                    tax,
                    total,
                },
                summary,
            }).unwrap();
            dispatch(clearActiveTableCart());
            toast.success("Venta completada");
            if (!isQuick) {
                router.push("/tables");
            }
        } catch (error) {
            console.error("checkout order", error);
            if (isCashClosedError(error)) {
                toast.error("Caja cerrada. Abre la caja para vender.");
                throw error instanceof Error ? error : new Error("cash-closed");
            }
            toast.error("No pudimos finalizar la venta");
            throw error instanceof Error ? error : new Error("checkout-failed");
        }
    };

    return (
        <div className="w-full h-full bg-slate-50 border-l border-gray-300 p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-bold">{orderLabel}</h2>
                    <p className="text-xs text-slate-500">
                        {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
                    </p>
                </div>
                <button
                    className="text-xs px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-40"
                    disabled={items.length === 0 || isDeleting || isFinalizing}
                    onClick={handleClear}
                >
                    Vaciar
                </button>
            </div>

            <div className="flex-1 flex min-h-0 p-2">
                <div className="flex-1 overflow-y-auto space-y-2">
                    {items.length === 0 && (
                        <p className="text-sm text-slate-500">No hay productos en la orden.</p>
                    )}
                    {items.map((item) => (
                        <CartItemRow key={item.id} id={item.id} title={item.title} price={item.price} quantity={item.quantity} />
                    ))}
                </div>
            </div>

            <div className="w-full mt-2 pt-4 border-t space-y-1">
                <div className="flex justify-between text-slate-600">
                    <span>Subtotal (sin impuesto)</span>
                    <span>${netSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                    <span>Impuesto ({(TAX_RATE * 100).toFixed(0)}%)</span>
                    <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl text-slate-800 mt-2">
                    <span>Total (incluye impuesto)</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-4 mt-4">
                <button
                    onClick={handleSaveOrder}
                    className="w-full bg-slate-600 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition-colors text-lg disabled:bg-slate-400"
                    disabled={items.length === 0 || isSaving || isFinalizing}
                >
                    {isSaving ? "Guardando..." : "Guardar Orden"}
                </button>
                <button
                    onClick={() => setPaymentOpen(true)}
                    className="w-full bg-sky-500 text-white font-bold py-3 rounded-lg hover:bg-sky-600 transition-colors text-lg disabled:bg-slate-400"
                    id="checkout-button"
                    disabled={items.length === 0 || isFinalizing || !canCheckout}
                >
                    {cashLoading
                        ? "Verificando caja..."
                        : isFinalizing
                          ? "Procesando..."
                          : canCheckout
                            ? "Proceder al Pago"
                            : "Caja cerrada"}
                </button>
            </div>
            <CheckoutDialog
                open={paymentOpen}
                subtotal={netSubtotal}
                tax={tax}
                total={total}
                cashOpen={cashStatus?.open}
                cashStatusLoading={cashLoading}
                onClose={() => setPaymentOpen(false)}
                onComplete={handlePaymentComplete}
            />
        </div>
    );
};

export default SideSummarySale;
