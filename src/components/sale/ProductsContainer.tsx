"use client";
import Product from "@/components/sale/Product";
import React from "react";

// Temporary static product catalog; replace with data from API later
const PRODUCTS = Array.from({ length: 30 }, (_, i) => ({
  id: `p-${i + 1}`,
  title: `Producto ${i + 1}`,
  price: Number((Math.random() * 50 + 5).toFixed(2)),
}));

const ProductsContainer = () => {
    return (
        <div className={"w-full max-h-full min-h-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"}>
            {PRODUCTS.map(p => <Product key={p.id} id={p.id} title={p.title} price={p.price} />)}
        </div>
    );
};

export default ProductsContainer;