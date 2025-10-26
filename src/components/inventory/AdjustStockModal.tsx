"use client";
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { useAdjustStockMutation } from '@/store/slices/inventoryApi';
import { ProductDTO } from '@/store/slices/productsApi';

export type InventoryProduct = ProductDTO & { _id: string };

interface AdjustStockModalProps {
  product: InventoryProduct;
  onClose: () => void;
  onAdjusted?: () => Promise<void> | void;
}

export default function AdjustStockModal({ product, onClose, onAdjusted }: AdjustStockModalProps) {
  const [adjustStock, { isLoading }] = useAdjustStockMutation();
  const [newStock, setNewStock] = useState<number>(product.stock);
  const [reason, setReason] = useState<string>('');

  const handleStockChange = (e: ChangeEvent<HTMLInputElement>) => setNewStock(Number(e.target.value));
  const handleReasonChange = (e: ChangeEvent<HTMLInputElement>) => setReason(e.target.value);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await adjustStock({ productId: product._id, newStock, reason }).unwrap();
      toast.success('Stock actualizado');
      if (onAdjusted) await onAdjusted();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo actualizar el stock');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Ajustar Inventario</h2>
            <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl" aria-label="Cerrar">&times;</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{product.name}</h3>
              <p className="text-sm text-slate-500">SKU: {product.sku}</p>
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
            <button type="button" onClick={onClose} className="bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="bg-sky-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-600" disabled={isLoading}>Guardar Ajuste</button>
          </div>
        </form>
      </div>
    </div>
  );
}

