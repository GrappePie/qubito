"use client";
import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useLazyGetHistoryQuery, AdjustmentEntry } from '@/store/slices/inventoryApi';
import { ProductDTO } from '@/store/slices/productsApi';

export type InventoryProduct = ProductDTO & { _id: string };

interface StockHistoryModalProps {
  product: InventoryProduct;
  onClose: () => void;
}

export default function StockHistoryModal({ product, onClose }: StockHistoryModalProps) {
  const [triggerGetHistory, { data, isFetching, isError }] = useLazyGetHistoryQuery();

  useEffect(() => {
    (async () => {
      try {
        const res = await triggerGetHistory({ productId: product._id }).unwrap();
        if ((res.history || []).length === 0) {
          toast('Sin historial de ajustes', { icon: 'ℹ️' });
        }
      } catch (e) {
        console.error(e);
        toast.error('No se pudo cargar el historial');
      }
    })();
  }, [product._id, triggerGetHistory]);

  const history: AdjustmentEntry[] = data?.history || [];

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Historial de Ajustes</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl" aria-label="Cerrar">&times;</button>
        </div>
        <div className="p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">{product.name}</h3>
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
              {isFetching ? (
                <tr><td colSpan={4} className="text-center p-4 text-slate-500">Cargando...</td></tr>
              ) : isError ? (
                <tr><td colSpan={4} className="text-center p-4 text-red-500">Error al cargar.</td></tr>
              ) : history.length === 0 ? (
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
          <button type="button" onClick={onClose} className="bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-lg hover:bg-slate-50">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

