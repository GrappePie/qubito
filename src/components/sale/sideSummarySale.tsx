"use client";
import CartItemRow from "@/components/sale/CartItemRow";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectCartItems, selectSubtotal, selectActiveTableId, selectIsQuickOrder, clearActiveTableCart } from "@/store/slices/cartSlice";

const TAX_RATE = 0.16;

const SideSummarySale = () => {
    const dispatch = useAppDispatch();
    const items = useAppSelector(selectCartItems); // cast due to local selector typing shape
    const subtotal = useAppSelector(selectSubtotal);
    const activeTableId = useAppSelector(selectActiveTableId);
    const isQuick = useAppSelector(selectIsQuickOrder);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    return (
        <div className="w-full h-full bg-slate-50 border-l border-gray-300 p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">{isQuick ? 'Orden Rápida' : `Mesa #${activeTableId}`}</h2>
                <button
                    className="text-xs px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-40"
                    disabled={items.length === 0}
                    onClick={() => dispatch(clearActiveTableCart())}
                >Vaciar</button>
            </div>

            {/* Parte scrolleable */}
            <div className="flex-1 flex min-h-0 p-2">
                <div className="flex-1 overflow-y-auto space-y-2">
                    {items.length === 0 && (
                        <p className="text-sm text-slate-500">No hay productos en la orden.</p>
                    )}
                    {items.map(i => (
                        <CartItemRow key={i.id} id={i.id} title={i.title} price={i.price} quantity={i.quantity} />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="w-full mt-2 pt-4 border-t space-y-1">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span
                    id="cart-subtotal">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Impuestos (16%)</span><span
                    id="cart-tax">${tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-xl text-slate-800 mt-2"><span>Total</span><span
                    id="cart-total">${total.toFixed(2)}</span></div>
            </div>
            <div className="w-full grid grid-cols-2 gap-4 mt-4">
                <button
                    onClick={() => console.log("saveOrderAndExit()")}
                    className="w-full bg-slate-600 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition-colors text-lg disabled:bg-slate-400"
                    disabled={items.length === 0}
                >
                    Guardar Orden
                </button>
                <button
                    onClick={() => console.log("openPaymentModal()")}
                    className="w-full bg-sky-500 text-white font-bold py-3 rounded-lg hover:bg-sky-600 transition-colors text-lg disabled:bg-slate-400"
                    id="checkout-button"
                    disabled={items.length === 0}
                >
                    Proceder al Pago
                </button>
            </div>
        </div>
    );
};

export default SideSummarySale;