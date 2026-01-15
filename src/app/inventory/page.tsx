"use client";

import React, { useState } from 'react';
import TitlePage from '@/components/common/TitlePage';
import { useGetProductsQuery, type ProductDTO } from '@/store/slices/productsApi';
import { toast } from 'react-hot-toast';
import InventoryTable from '@/components/inventory/InventoryTable';
import AdjustStockModal from '@/components/inventory/AdjustStockModal';
import StockHistoryModal from '@/components/inventory/StockHistoryModal';
import PermissionGate from '@/components/PermissionGate';

// Interfaz para el objeto de producto según productos API
type Product = ProductDTO & { _id: string };

function InventoryContent() {
  const { data: products = [], isLoading, refetch } = useGetProductsQuery();

  // Modal Ajuste
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  // Modal Historial
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const openAdjustModal = (product: Product) => setAdjustingProduct(product);
  const closeAdjustModal = () => setAdjustingProduct(null);

  const openHistoryModal = (product: Product) => setHistoryProduct(product);
  const closeHistoryModal = () => setHistoryProduct(null);

  const handleAdjusted = async () => {
    try {
      await refetch();
    } catch (e) {
      console.error(e);
      toast.error('No se pudo refrescar inventario');
    }
  };

  return (
    <div>
      <TitlePage title="Inventario" subtitle="Controla el stock de tus productos." />
      <InventoryTable
        products={products}
        loading={isLoading}
        onAdjust={(p) => openAdjustModal(p)}
        onHistory={(p) => openHistoryModal(p)}
      />

      {adjustingProduct && (
        <AdjustStockModal
          product={adjustingProduct}
          onClose={closeAdjustModal}
          onAdjusted={handleAdjusted}
        />
      )}

      {historyProduct && (
        <StockHistoryModal
          product={historyProduct}
          onClose={closeHistoryModal}
        />
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <PermissionGate permission="inventory.manage" redirectTo="/">
      <InventoryContent />
    </PermissionGate>
  );
}
