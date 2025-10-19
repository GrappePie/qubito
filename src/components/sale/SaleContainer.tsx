"use client";
import TopSearchBar from "@/components/sale/TopSearchBar";
import { IoMdArrowBack } from "react-icons/io";
import ProductsContainer from "@/components/sale/ProductsContainer";
import React, { useState } from "react";
import CategoryChipsContainer from "@/components/sale/CategoryChipsContainer";
import { useAppSelector } from "@/store/hooks";
import { selectActiveTableId, selectIsQuickOrder } from "@/store/slices/cartSlice";
import { useRouter } from "next/navigation";

const categories = Array.from({ length: 20 }, (_, i) => `Categoría ${i + 1}`);

const SaleContainer = () => {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const activeTableId = useAppSelector(selectActiveTableId);
    const isQuick = useAppSelector(selectIsQuickOrder);
    const router = useRouter();

    // Eliminamos el redirect forzado cuando no hay mesa para permitir orden rápida

    return (
        <div className="w-full h-full min-h-0 flex flex-col">
            <div className="w-full h-16 flex p-2 gap-4 items-center">
                <TopSearchBar />
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
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
            />
            <div className="flex-1 m-2 overflow-y-auto">
                <ProductsContainer />
            </div>
        </div>
    );
};

export default SaleContainer;