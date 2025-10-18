"use client";
import TopSearchBar from "@/components/sale/TopSearchBar";
import { IoMdArrowBack } from "react-icons/io";
import ProductsContainer from "@/components/sale/ProductsContainer";
import React, { useState, useEffect } from "react";
import CategoryChipsContainer from "@/components/sale/CategoryChipsContainer";
import { useAppSelector } from "@/store/hooks";
import { selectActiveTableId } from "@/store/slices/cartSlice";
import { useRouter } from "next/navigation";

const categories = Array.from({ length: 20 }, (_, i) => `Categoría ${i + 1}`);

const SaleContainer = () => {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const activeTableId = useAppSelector(selectActiveTableId);
    const router = useRouter();

    useEffect(() => {
        if (activeTableId == null) {
            // Si no hay mesa activa, regresar a la vista de mesas
            router.replace('/tables');
        }
    }, [activeTableId, router]);

    if (activeTableId == null) {
        return (
            <div className="flex items-center justify-center h-full text-slate-600">
                Cargando mesa...
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-0 flex flex-col">
            {/* Barra superior */}
            <div className="w-full h-16 flex p-2 gap-4 items-center">
                <TopSearchBar />
                <div className="flex items-center gap-4 ml-auto">
                    <div className="px-4 h-10 flex items-center rounded-lg bg-slate-800 text-white font-semibold">
                        Mesa #{activeTableId}
                    </div>
                    <button
                        onClick={() => router.push('/tables')}
                        className="bg-slate-200 text-slate-800 font-semibold px-4 h-10 rounded-lg hover:bg-slate-300 transition-colors flex items-center gap-2"
                    >
                        <IoMdArrowBack /> Volver a Mesas
                    </button>
                </div>
            </div>
            {/* Chips de categorías */}
            <CategoryChipsContainer
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
            />
            {/* Productos */}
            <div className="flex-1 m-2 overflow-y-auto">
                <ProductsContainer />
            </div>
        </div>
    );
};

export default SaleContainer;