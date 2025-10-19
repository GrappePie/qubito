"use client";

import React, { useState, FormEvent, ChangeEvent } from 'react';
import TitlePage from '@/components/common/TitlePage';
import { useGetProductsQuery, type ProductDTO } from '@/store/slices/productsApi';
import { useAdjustStockMutation, useLazyGetHistoryQuery, type AdjustmentEntry } from '@/store/slices/inventoryApi';
import { toast } from 'react-hot-toast';

// Interfaz para el objeto de producto según productos API
type Product = ProductDTO & { _id: string };

export default function InventoryPage() {
    const { data: products = [], isLoading, refetch } = useGetProductsQuery();
    const [adjustStock, { isLoading: isAdjusting }] = useAdjustStockMutation();
    const [triggerGetHistory] = useLazyGetHistoryQuery();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [newStock, setNewStock] = useState(0);
    const [reason, setReason] = useState("");

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [history, setHistory] = useState<AdjustmentEntry[]>([]);
    const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

    const handleOpenModal = (product: Product) => {
        setCurrentProduct(product);
        setNewStock(product.stock);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
        setNewStock(0);
        setReason("");
    };

    const handleStockChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNewStock(Number(e.target.value));
    };

    const handleReasonChange = (e: ChangeEvent<HTMLInputElement>) => {
        setReason(e.target.value);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentProduct) return;
        try {
            await adjustStock({ productId: currentProduct._id, newStock, reason }).unwrap();
            toast.success('Stock actualizado');
            handleCloseModal();
            // Intentar refrescar productos para reflejar cambios (si aplica)
            await refetch();
        } catch (error) {
            console.error(error);
            toast.error('No se pudo actualizar el stock');
        }
    };

    const handleOpenHistoryModal = async (product: Product) => {
        setHistoryProduct(product);
        setIsHistoryModalOpen(true);
        try {
            const res = await triggerGetHistory({ productId: product._id }).unwrap();
            setHistory(res.history || []);
            if ((res.history || []).length === 0) {
                toast('Sin historial de ajustes', { icon: 'ℹ️' });
            }
        } catch (error) {
            setHistory([]);
            console.error(error);
            toast.error('No se pudo cargar el historial');
        }
    };

    const handleCloseHistoryModal = () => {
        setIsHistoryModalOpen(false);
        setHistoryProduct(null);
        setHistory([]);
    };

    const getStatusBadge = (product: Product) => {
        if (product.stock <= 0) {
            return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Sin Stock</span>;
        }
        if (product.stock <= product.lowStock) {
            return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Stock Bajo</span>;
        }
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">En Stock</span>;
    };

    return (
        <div>
            <TitlePage title="Inventario" subtitle="Controla el stock de tus productos." />
            <div className="mt-6 bg-white rounded-lg shadow-sm overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-4 text-sm font-semibold text-slate-600">Producto</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">SKU</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">Stock Actual</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">Nivel Bajo</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">Estado</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                    {isLoading ? (
                        <tr><td colSpan={6} className="text-center p-8 text-slate-500">Cargando...</td></tr>
                    ) : (
                        // Filtrar a una lista segura donde _id existe
                        (products.filter((p): p is Product => Boolean(p._id)) as Product[]).map((product) => (
                        <tr key={product._id}>
                            <td className="p-4 font-medium text-slate-800">{product.name}</td>
                            <td className="p-4 text-slate-500">{product.sku}</td>
                            <td className="p-4 text-slate-500">{product.stock}</td>
                            <td className="p-4 text-slate-500">{product.lowStock}</td>
                            <td className="p-4">{getStatusBadge(product)}</td>
                            <td className="p-4">
                                <button onClick={() => handleOpenModal(product)} className="text-sky-600 hover:text-sky-800 font-medium mr-2" disabled={isAdjusting}>Ajustar</button>
                                <button onClick={() => handleOpenHistoryModal(product)} className="text-amber-600 hover:text-amber-800 font-medium">Ver historial</button>
                            </td>
                        </tr>
                    )))}
                    </tbody>
                </table>
            </div>

            {/* Modal para Ajustar Inventario */}
            {isModalOpen && currentProduct && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 border-b flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-slate-800">Ajustar Inventario</h2>
                                <button type="button" onClick={handleCloseModal} className="text-slate-500 hover:text-slate-800 text-2xl">&times;</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">{currentProduct.name}</h3>
                                    <p className="text-sm text-slate-500">SKU: {currentProduct.sku}</p>
                                </div>
                                <div>
                                    <label htmlFor="inventory-new-stock" className="block text-sm font-medium text-slate-700">Nueva Cantidad en Stock</label>
                                    <input type="number" id="inventory-new-stock" value={newStock} onChange={handleStockChange} required className="mt-1 block w-full" />
                                </div>
                                <div>
                                    <label htmlFor="inventory-reason" className="block text-sm font-medium text-slate-700">Razón del Ajuste (Opcional)</label>
                                    <input type="text" id="inventory-reason" placeholder="Ej: Recepción de proveedor" className="mt-1 block w-full" value={reason} onChange={handleReasonChange} />
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-b-xl flex justify-end space-x-4">
                                <button type="button" onClick={handleCloseModal} className="bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-lg hover:bg-slate-50">Cancelar</button>
                                <button type="submit" className="bg-sky-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-600" disabled={isAdjusting}>Guardar Ajuste</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para Historial de Ajustes */}
            {isHistoryModalOpen && historyProduct && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">Historial de Ajustes</h2>
                            <button type="button" onClick={handleCloseHistoryModal} className="text-slate-500 hover:text-slate-800 text-2xl">&times;</button>
                        </div>
                        <div className="p-6 overflow-x-auto">
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">{historyProduct.name}</h3>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-2 text-sm font-semibold text-slate-600">Fecha</th>
                                        <th className="p-2 text-sm font-semibold text-slate-600">Stock anterior</th>
                                        <th className="p-2 text-sm font-semibold text-slate-600">Stock nuevo</th>
                                        <th className="p-2 text-sm font-semibold text-slate-600">Razón</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {history.length === 0 ? (
                                        <tr><td colSpan={4} className="text-center p-4 text-slate-500">Sin ajustes registrados.</td></tr>
                                    ) : history.map((h, idx) => (
                                        <tr key={idx}>
                                            <td className="p-2 text-slate-500">{new Date(h.date).toLocaleString()}</td>
                                            <td className="p-2 text-slate-500">{h.previousStock}</td>
                                            <td className="p-2 text-slate-500">{h.newStock}</td>
                                            <td className="p-2 text-slate-500">{h.reason || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-b-xl flex justify-end">
                            <button type="button" onClick={handleCloseHistoryModal} className="bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-lg hover:bg-slate-50">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
