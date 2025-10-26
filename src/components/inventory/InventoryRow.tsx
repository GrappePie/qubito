"use client";
import React from 'react';
import InventoryStatusBadge from './InventoryStatusBadge';
import { ProductDTO } from '@/store/slices/productsApi';

export type InventoryProduct = ProductDTO & { _id: string };

interface RowProps {
  product: InventoryProduct;
  onAdjust: (p: InventoryProduct) => void;
  onHistory: (p: InventoryProduct) => void;
  disabledAdjust?: boolean;
}

export function InventoryRow({ product, onAdjust, onHistory, disabledAdjust }: RowProps) {
  return (
    <tr key={product._id}>
      <td className="p-4 font-medium text-slate-800">{product.name}</td>
      <td className="p-4 text-slate-500">{product.sku}</td>
      <td className="p-4 text-slate-500">{product.stock}</td>
      <td className="p-4 text-slate-500">{product.lowStock}</td>
      <td className="p-4"><InventoryStatusBadge stock={product.stock} lowStock={product.lowStock} /></td>
      <td className="p-4">
        <button onClick={() => onAdjust(product)} className="text-sky-600 hover:text-sky-800 font-medium mr-2" disabled={disabledAdjust}>Ajustar</button>
        <button onClick={() => onHistory(product)} className="text-amber-600 hover:text-amber-800 font-medium">Ver historial</button>
      </td>
    </tr>
  );
}

export default InventoryRow;

