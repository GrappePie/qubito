"use client";
import TopSearchBar from "@/components/sale/TopSearchBar";
import { IoMdArrowBack } from "react-icons/io";
import ProductsContainer from "@/components/sale/ProductsContainer";
import React, { useMemo, useState } from "react";
import CategoryChipsContainer from "@/components/sale/CategoryChipsContainer";
import { useAppSelector } from "@/store/hooks";
import { selectActiveTableId, selectIsQuickOrder } from "@/store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { useGetProductsQuery } from "@/store/slices/productsApi";
import { useGetCategoriesQuery } from "@/store/slices/categoriesApi";

const SaleContainer = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const activeTableId = useAppSelector(selectActiveTableId);
  const isQuick = useAppSelector(selectIsQuickOrder);
  const router = useRouter();

  const { data: products = [], isLoading: loadingProducts } = useGetProductsQuery();
  const { data: categoriesData = [], isLoading: loadingCategories } = useGetCategoriesQuery();
  const categoryNames = useMemo(() => categoriesData.map(c => c.name), [categoriesData]);

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
    const selectedName = selectedCategory != null ? categoryNames[selectedCategory] : undefined;
    return products.filter(p =>
      bySearch(p.name, p.sku, p.barCode) &&
      (!selectedName || (Array.isArray(p.categories) && p.categories.includes(selectedName)))
    );
  }, [products, search, selectedCategory, categoryNames]);

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      <div className="w-full h-16 flex p-2 gap-4 items-center">
        <TopSearchBar value={search} onChange={setSearch} />
        <button
          onClick={() => { setSearch(""); setSelectedCategory(null); }}
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
        categories={categoryNames}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
      <div className="flex-1 m-2 overflow-y-auto">
        {loadingProducts || loadingCategories ? (
          <div className="p-4 text-slate-500">Cargando...</div>
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
