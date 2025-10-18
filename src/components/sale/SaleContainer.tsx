"use client";
import TopSearchBar from "@/components/sale/TopSearchBar";
import { IoMdArrowBack } from "react-icons/io";
import ProductsContainer from "@/components/sale/ProductsContainer";
import React, { useState } from "react";
import CategoryChipsContainer from "@/components/sale/CategoryChipsContainer";


const categories = Array.from({ length: 20 }, (_, i) => `Categoría ${i + 1}`);

const SaleContainer = () => {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    return (
        <div className={"w-full h-full min-h-0 flex flex-col"}>
            {/* Search bar container */}
            <div className={"w-full h-16 flex p-2"}>
                {/* Search bar */}
                <TopSearchBar/>
                <div className={"w-1/2 flex justify-end"} >
                    <button
                        className="bg-slate-200 text-slate-800 font-semibold px-4 h-10 rounded-lg hover:bg-slate-300 transition-colors flex items-center">
                        <IoMdArrowBack />
                        Volver a Mesas
                    </button>
                </div>
            </div>
            {/*Categories container*/}
            <CategoryChipsContainer
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
            />
            {/* Products container */}
            <div className={"flex-1 m-2 overflow-y-auto"}>
                <ProductsContainer/>
            </div>
        </div>
    );
};

export default SaleContainer;