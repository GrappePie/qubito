"use client";
import SideProduct from "@/components/sale/SideProduct";

const SideSummarySale = () => {
    return (
        <div className="w-full h-full bg-slate-50 border-l border-gray-300 p-4 flex flex-col min-h-0">
            {/* Header */}
            <h2 className="text-xl font-bold">Orden</h2>

            {/* Parte scrolleable */}
            <div className={"flex-1 flex min-h-0 p-2"}>
                <div className="flex-1 overflow-y-auto space-y-2">
                    <SideProduct title="Crossaint" price={23.13} quantity={2}/>
                    <SideProduct title="Pan de caja" price={45.00} quantity={1}/>
                    <SideProduct title="Jamon" price={12.50} quantity={4}/>
                    <SideProduct title="Queso" price={15.75} quantity={3}/>
                    <SideProduct title="Leche" price={8.90} quantity={2}/>
                    <SideProduct title="Huevos" price={20.00} quantity={6}/>
                    <SideProduct title="Cereal" price={30.25} quantity={1}/>
                    <SideProduct title="Fruta" price={18.40} quantity={5}/>
                    <SideProduct title="Verduras" price={22.10} quantity={2}/>
                    <SideProduct title="Carne" price={55.60} quantity={3}/>
                    <SideProduct title="Pescado" price={40.80} quantity={1}/>
                </div>
            </div>

            {/* Footer */}
                <div className="w-full mt-2 pt-4 border-t">
                    <div className="flex justify-between text-slate-600"><span>Subtotal</span><span
                        id="cart-subtotal">$0.00</span></div>
                    <div className="flex justify-between text-slate-600 mt-1"><span>Impuestos (16%)</span><span
                        id="cart-tax">$0.00</span></div>
                    <div className="flex justify-between font-bold text-xl text-slate-800 mt-2"><span>Total</span><span
                        id="cart-total">$0.00</span></div>
                </div>
                <div className="w-full grid grid-cols-2 gap-4 mt-4">
                    <button onClick={() => console.log("saveOrderAndExit()")}
                            className="w-full bg-slate-600 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition-colors text-lg">
                        Guardar Orden
                    </button>
                    <button onClick={() => console.log("openPaymentModal()")}
                            className="w-full bg-sky-500 text-white font-bold py-3 rounded-lg hover:bg-sky-600 transition-colors text-lg disabled:bg-slate-400"
                            id="checkout-button" disabled={false}>
                        Proceder al Pago
                    </button>
                </div>
            </div>
        

    );
};

export default SideSummarySale;