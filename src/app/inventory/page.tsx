'use client';

import React, { useState } from 'react';

interface Product {
    _id: string;
    name: string;
    quantity: number;
    minThreshold: number;
    unit: string;
}

export default function InventoryPage() {
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', quantity: '', minThreshold: '', unit: '' });
    const [products, setProducts] = useState<Product[]>([]);
    const [showRestock, setShowRestock] = useState(false);
    const [restockForm, setRestockForm] = useState({ id: '', qty: '' });

    React.useEffect(() => {
        fetch('/api/inventory/list')
            .then(res => res.json())
            .then(data => setProducts(data));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/inventory/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: form.name,
                quantity: Number(form.quantity),
                minThreshold: Number(form.minThreshold),
                unit: form.unit,
            }),
        });
        if (res.ok) {
            setShowModal(false);
            setForm({ name: '', quantity: '', minThreshold: '', unit: '' });
            // Refrescar productos
            fetch('/api/inventory/list')
                .then(res => res.json())
                .then(data => setProducts(data));
        }
    };

    const handleRestockChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setRestockForm({ ...restockForm, [e.target.name]: e.target.value });
    };

    const handleRestock = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/inventory/restock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [{ id: restockForm.id, qty: Number(restockForm.qty) }] }),
        });
        if (res.ok) {
            setShowRestock(false);
            setRestockForm({ id: '', qty: '' });
            fetch('/api/inventory/list')
                .then(res => res.json())
                .then(data => setProducts(data));
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Inventory</h1>
            <div className="flex gap-4 mb-4">
                <button className="bg-gray-200 px-4 py-2 rounded text-black">Upload CSV</button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowModal(true)}>Add Product</button>
                <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => setShowRestock(true)}>Restock</button>
            </div>
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="text-xl font-bold mb-4">Agregar producto</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre" className="border px-3 py-2 rounded" required />
                            <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="Cantidad" type="number" className="border px-3 py-2 rounded" required />
                            <input name="minThreshold" value={form.minThreshold} onChange={handleChange} placeholder="Cantidad mínima" type="number" className="border px-3 py-2 rounded" required />
                            <input name="unit" value={form.unit} onChange={handleChange} placeholder="Unidad" className="border px-3 py-2 rounded" required />
                            <div className="flex gap-2 justify-end">
                                <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showRestock && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="text-xl font-bold mb-4">Reabastecer producto</h2>
                        <form onSubmit={handleRestock} className="flex flex-col gap-4">
                            <select name="id" value={restockForm.id} onChange={handleRestockChange} className="border px-3 py-2 rounded" required>
                                <option value="" disabled>Selecciona un producto</option>
                                {products.map((p: Product) => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                            <input name="qty" value={restockForm.qty} onChange={handleRestockChange} placeholder="Cantidad a agregar" type="number" min="1" className="border px-3 py-2 rounded" required />
                            <div className="flex gap-2 justify-end">
                                <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowRestock(false)}>Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white">Reabastecer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <table className="w-full border-collapse bg-white rounded shadow">
                <thead>
                <tr className="bg-gray-100 text-left text-black">
                    <th className="p-3">Product</th>
                    <th className="p-3">Current Quantity</th>
                    <th className="p-3">Minimum Quant.</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Status</th>
                </tr>
                </thead>
                <tbody>
                {products.map((p: Product) => {
                    const lowStock = p.quantity < p.minThreshold;
                    return (
                        <tr key={p._id} className="border-t text-black">
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3">{p.quantity}</td>
                            <td className="p-3">{p.minThreshold}</td>
                            <td className="p-3">{p.unit}</td>
                            <td className="p-3">
                                {lowStock ? (
                                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Low stock</span>
                                ) : (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">OK</span>
                                )}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}
