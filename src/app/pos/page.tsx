"use client";
import React, { useEffect, useState } from "react";

interface Product {
  _id: string;
  name: string;
  quantity: number;
  minThreshold: number;
  unit: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/inventory/list")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  const handleQtyChange = (id: string, value: number) => {
    setCart((prev) => ({ ...prev, [id]: value }));
  };

  const handleSell = async () => {
    setLoading(true);
    setMessage("");
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ id, qty }));
    if (items.length === 0) {
      setMessage("Selecciona al menos un producto y cantidad.");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/inventory/sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (res.ok) {
      setMessage("¡Venta realizada y stock actualizado!");
      setCart({});
      fetch("/api/inventory/list")
        .then((res) => res.json())
        .then((data) => setProducts(data));
    } else {
      setMessage("Error al procesar la venta.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Punto de Venta</h1>
      <table className="w-full border-collapse bg-white rounded shadow mb-6">
        <thead>
          <tr className="bg-gray-100 text-left text-black">
            <th className="p-3">Producto</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Unidad</th>
            <th className="p-3">Cantidad a vender</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id} className="border-t text-black">
              <td className="p-3 font-medium">{p.name}</td>
              <td className="p-3">{p.quantity}</td>
              <td className="p-3">{p.unit}</td>
              <td className="p-3">
                <input
                  type="number"
                  min={0}
                  max={p.quantity}
                  value={cart[p._id] || ""}
                  onChange={(e) => handleQtyChange(p._id, Number(e.target.value))}
                  className="border px-3 py-2 rounded w-24"
                  disabled={loading}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded"
        onClick={handleSell}
        disabled={loading}
      >
        {loading ? "Procesando..." : "Pagar y descontar stock"}
      </button>
      {message && <div className="mt-4 text-center font-semibold">{message}</div>}
    </div>
  );
}
