"use client";
import TopSearchBar from "@/components/sale/TopSearchBar";
import { IoMdArrowBack } from "react-icons/io";
import ProductsContainer from "@/components/sale/ProductsContainer";
import React, { useEffect, useMemo, useState } from "react";
import CategoryChipsContainer, { CategoryChipOption } from "@/components/sale/CategoryChipsContainer";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectActiveTableId, selectCartItems, selectIsQuickOrder, setActiveCartItems } from "@/store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { useGetProductsQuery } from "@/store/slices/productsApi";
import { useGetCategoriesQuery } from "@/store/slices/categoriesApi";
import { useGetOrderQuery } from "@/store/slices/ordersApi";
import { skipToken } from "@reduxjs/toolkit/query";

const SaleContainer = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const dispatch = useAppDispatch();
  const activeTableId = useAppSelector(selectActiveTableId);
  const isQuick = useAppSelector(selectIsQuickOrder);
  const cartItems = useAppSelector(selectCartItems);
  const router = useRouter();

  const contextId = isQuick ? "quick" : activeTableId != null ? `mesa-${activeTableId}` : null;

  const {
    data: products = [],
    isLoading: loadingProducts,
    isError: productsError,
  } = useGetProductsQuery();
  const {
    data: categoriesData = [],
    isLoading: loadingCategories,
    isError: categoriesError,
  } = useGetCategoriesQuery();
  const {
    data: existingOrder,
    isFetching: loadingOrder,
    isError: orderError,
  } = useGetOrderQuery(contextId ?? skipToken);

  const [hydratedSignature, setHydratedSignature] = useState<string | null>(null);

  useEffect(() => {
    setHydratedSignature(null);
  }, [contextId]);

  const categories: CategoryChipOption[] = useMemo(
    () =>
      categoriesData.map((c) => ({
        id: c._id || c.categoryId || c.name,
        name: c.name,
      })),
    [categoriesData],
  );

  useEffect(() => {
    if (selectedCategoryId && !categories.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
  }, [selectedCategoryId, categories]);

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return undefined;
    return categories.find((c) => c.id === selectedCategoryId)?.name;
  }, [selectedCategoryId, categories]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const bySearch = (name: string, sku?: string, bar?: string) => {
      if (!q) return true;
      return (
        name.toLowerCase().includes(q) ||
        (sku && sku.toLowerCase().includes(q)) ||
        (bar && bar.toLowerCase().includes(q))
      );
    };
    return products.filter(p =>
      bySearch(p.name, p.sku, p.barCode) &&
      (!selectedCategoryName || (Array.isArray(p.categories) && p.categories.includes(selectedCategoryName)))
    );
  }, [products, search, selectedCategoryName]);

  const isLoading = loadingProducts || loadingCategories || loadingOrder;
  const hasError = productsError || categoriesError || orderError;

  useEffect(() => {
    if (!existingOrder || !contextId) return;
    const signature = `${contextId}-${existingOrder.updatedAt ?? existingOrder.createdAt ?? ""}-${existingOrder.items.length}`;
    if (hydratedSignature === signature) return;
    const incoming = existingOrder.items.map((item) => ({
      id: item.productId,
      title: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      stock: item.stock,
      sku: item.sku,
    }));
    const sameLength = incoming.length === cartItems.length;
    const hasSameItems =
      sameLength &&
      incoming.every((incomingItem) => {
        const match = cartItems.find((c) => c.id === incomingItem.id);
        return match && match.quantity === incomingItem.quantity;
      });
    if (!hasSameItems) {
      dispatch(setActiveCartItems(incoming));
    }
    setHydratedSignature(signature);
  }, [existingOrder, contextId, hydratedSignature, dispatch, cartItems]);

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      <div className="w-full h-16 flex p-2 gap-4 items-center">
        <TopSearchBar value={search} onChange={setSearch} />
        <button
          onClick={() => { setSearch(""); setSelectedCategoryId(null); }}
          className="h-10 px-3 rounded-lg border text-slate-700 hover:bg-slate-100"
          title="Limpiar filtros"
        >
          Limpiar filtros
        </button>
        <div className="flex items-center gap-4 ml-auto">
          <div className={`px-4 h-10 flex items-center rounded-lg font-semibold text-white ${isQuick ? 'bg-indigo-600' : 'bg-slate-800'}`}>
            {isQuick ? 'Orden Rápida' : `Mesa #${activeTableId}`}
          </div>
          <button
            onClick={() => router.push('/tables')}
            className="bg-slate-200 text-slate-800 font-semibold px-4 h-10 rounded-lg hover:bg-slate-300 transition-colors flex items-center gap-2"
          >
            <IoMdArrowBack /> Volver
          </button>
        </div>
      </div>
      <CategoryChipsContainer
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />
      <div className="flex-1 m-2 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-slate-500">Cargando...</div>
        ) : hasError ? (
          <div className="p-4 text-rose-600">No pudimos cargar productos, categorías o la orden guardada. Intenta nuevamente.</div>
  ) : filteredProducts.length === 0 ? (
          <div className="p-4 text-slate-500">No hay productos que coincidan con los filtros.</div>
        ) : (
          <ProductsContainer products={filteredProducts} />
        )}
      </div>
    </div>
  );
};

export default SaleContainer;
