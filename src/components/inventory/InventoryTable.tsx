"use client";
import React from 'react';
import { ProductDTO } from '@/store/slices/productsApi';
import InventoryRow, { InventoryProduct } from './InventoryRow';

interface TableProps {
  products: ProductDTO[];
  loading: boolean;
  onAdjust: (p: InventoryProduct) => void;
  onHistory: (p: InventoryProduct) => void;
  disabledAdjust?: boolean;
}

export function InventoryTable({ products, loading, onAdjust, onHistory, disabledAdjust }: TableProps) {
  const safeProducts: InventoryProduct[] = (products.filter((p): p is InventoryProduct => Boolean(p._id)) as InventoryProduct[]);
  return (
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
          {loading ? (
            <tr><td colSpan={6} className="text-center p-8 text-slate-500">Cargando...</td></tr>
          ) : safeProducts.map((p) => (
            <InventoryRow key={p._id} product={p} onAdjust={onAdjust} onHistory={onHistory} disabledAdjust={disabledAdjust} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryTable;

