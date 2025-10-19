"use client";
import Product from "@/components/sale/Product";
import React from "react";
import type { ProductDTO } from "@/store/slices/productsApi";

interface ProductsContainerProps {
  products: ProductDTO[];
}

const ProductsContainer: React.FC<ProductsContainerProps> = ({ products }) => {
  return (
    <div className={"w-full max-h-full min-h-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"}>
      {products.map((p) => (
        <Product
          key={(p._id as string) || p.sku}
          id={((p._id as string) || p.sku)}
          title={p.name}
          price={p.price}
          image={p.imageUrl}
          stock={p.stock}
        />
      ))}
    </div>
  );
};

export default ProductsContainer;
