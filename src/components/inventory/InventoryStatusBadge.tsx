"use client";
import React from 'react';

interface Props {
  stock: number;
  lowStock: number;
}

export function InventoryStatusBadge({ stock, lowStock }: Props) {
  if (stock <= 0) {
    return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Sin Stock</span>;
  }
  if (stock <= lowStock) {
    return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Stock Bajo</span>;
  }
  return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">En Stock</span>;
}

export default InventoryStatusBadge;

